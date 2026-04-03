import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  Inventory, Catalogue, Vendor, PurchaseOrder, 
  MaterialPlan, GRN, Inward, Outward, InwardReturn, OutwardReturn, WriteOff, User, StockCheckReport, Settings 
} from './models.ts';
import { broadcast } from './broadcaster.ts';
import { upload } from './cloudinary.ts';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Public Routes for unauthenticated data entry
router.get('/public/inventory', async (req, res) => {
  try {
    const items = await Inventory.find().select('sku name unit liveStock category lastProject').sort({ name: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/public/vendors', async (req, res) => {
  try {
    const vendors = await Vendor.find().select('name').sort({ name: 1 }).lean();
    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/public/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: (req.file as any).path });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/public/inward', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inwardData = req.body;
    const inward = new Inward(inwardData);
    await inward.save({ session });

    // Update Inventory
    await Inventory.findOneAndUpdate(
      { sku: inwardData.sku },
      { $inc: { liveStock: inwardData.qty } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    broadcast({ type: 'DATA_UPDATED', path: 'inward' });
    broadcast({ type: 'DATA_UPDATED', path: 'inventory' });
    
    broadcast({ 
      type: 'NOTIFICATION', 
      message: `New Public Inward Entry: ${inward.id} for ${inward.name}`,
      severity: 'info'
    });

    res.status(201).json({ success: true, data: inward });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/public/outward', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const outwardData = req.body;
    
    // Check stock
    const inv = await Inventory.findOne({ sku: outwardData.sku });
    if (!inv || inv.liveStock < outwardData.qty) {
      throw new Error('Insufficient stock or item not found');
    }

    const outward = new Outward(outwardData);
    await outward.save({ session });

    // Update Inventory
    await Inventory.findOneAndUpdate(
      { sku: outwardData.sku },
      { $inc: { liveStock: -outwardData.qty } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    broadcast({ type: 'DATA_UPDATED', path: 'outward' });
    broadcast({ type: 'DATA_UPDATED', path: 'inventory' });

    broadcast({ 
      type: 'NOTIFICATION', 
      message: `New Public Outward Entry: ${outward.id} for ${outward.name}`,
      severity: 'info'
    });

    res.status(201).json({ success: true, data: outward });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
});

// Auth Routes
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email?.trim().toLowerCase();
    console.log(`Login attempt for: ${trimmedEmail}`);
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log(`User not found: ${trimmedEmail}`);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Password mismatch for: ${trimmedEmail}`);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    console.log(`Login successful for: ${trimmedEmail}`);
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error(`Login error for ${req.body.email}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Auth Middleware
const protect = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// Image upload endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: (req.file as any).path });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to create CRUD routes
const createCrudRoutes = (model: any, path: string) => {
  router.get(`/${path}`, protect, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;
      const fields = (req.query.fields as string) || '';

      const items = await model.find()
        .select(fields)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await model.countDocuments();

      res.json({
        success: true,
        data: items,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post(`/${path}`, protect, async (req, res) => {
    try {
      const item = new model(req.body);
      const savedItem = await item.save();
      broadcast({ type: 'DATA_UPDATED', path });
      
      // Add notification for PO creation
      if (path === 'pos') {
        broadcast({ 
          type: 'NOTIFICATION', 
          message: `New Purchase Order Created: ${savedItem.id || savedItem._id}`,
          severity: 'info',
          senderId: (req as any).user?._id
        });
      } else {
        broadcast({ 
          type: 'NOTIFICATION', 
          message: `New ${path.charAt(0).toUpperCase() + path.slice(1)} entry created`,
          severity: 'info',
          senderId: (req as any).user?._id
        });
      }
      
      res.status(201).json({ success: true, data: savedItem });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  router.put(`/${path}/:id(*)`, protect, async (req, res) => {
    try {
      const id = req.params.id || req.params[0];
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID is required' });
      }

      // For PO approval tracking, get the old item first
      let oldItem = null;
      if (path === 'pos') {
        oldItem = await model.findOne({ id: id });
      }

      let updatedItem = await model.findOneAndUpdate(
        { id: id }, 
        req.body, 
        { new: true }
      );
      
      if (!updatedItem && path !== 'pos') {
        // Try by SKU for other models if ID fails
        updatedItem = await model.findOneAndUpdate(
          { sku: id },
          req.body,
          { new: true }
        );
      }

      if (!updatedItem) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      broadcast({ type: 'DATA_UPDATED', path });

      // Add notifications for PO updates and approvals
      if (path === 'pos') {
        if (oldItem && oldItem.status !== updatedItem.status) {
          broadcast({ 
            type: 'NOTIFICATION', 
            message: `Purchase Order ${updatedItem.id} status changed to: ${updatedItem.status}`,
            severity: updatedItem.status === 'Approved' ? 'success' : 'info',
            senderId: (req as any).user?._id
          });
        } else {
          broadcast({ 
            type: 'NOTIFICATION', 
            message: `Purchase Order Updated: ${updatedItem.id}`,
            severity: 'info',
            senderId: (req as any).user?._id
          });
        }
      } else {
        broadcast({ 
          type: 'NOTIFICATION', 
          message: `${path.charAt(0).toUpperCase() + path.slice(1)} entry updated`,
          severity: 'info',
          senderId: (req as any).user?._id
        });
      }

      res.json({ success: true, data: updatedItem });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  router.delete(`/${path}/:id(*)`, protect, async (req, res) => {
    try {
      const id = req.params.id || req.params[0];
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID is required' });
      }

      let deletedItem = await model.findOneAndDelete({ id: id });
      
      if (!deletedItem && path !== 'pos') {
        deletedItem = await model.findOneAndDelete({ sku: id });
      }

      if (!deletedItem) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      broadcast({ type: 'DATA_UPDATED', path });

      // Add notification for PO deletion
      if (path === 'pos') {
        broadcast({ 
          type: 'NOTIFICATION', 
          message: `Purchase Order Deleted: ${id}`,
          severity: 'warning',
          senderId: (req as any).user?._id
        });
      } else {
        broadcast({ 
          type: 'NOTIFICATION', 
          message: `${path.charAt(0).toUpperCase() + path.slice(1)} entry deleted`,
          severity: 'warning',
          senderId: (req as any).user?._id
        });
      }

      res.json({ success: true, message: 'Item deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// Custom GRN Creation with PO status and Inventory update
router.post('/grn', protect, async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const grnData = req.body;
    
    // 1. Create the GRN
    const grn = new GRN(grnData);
    await grn.save({ session });

    // 2. Recalculate PO status based on all GRNs for this PO
    const allGRNs = await GRN.find({ poId: grnData.poId }, null, { session });
    const po = await PurchaseOrder.findOne({ id: grnData.poId }, null, { session });
    
    let hasVariance = false;
    if (po) {
      // Calculate total received across all GRNs
      const totalReceived: Record<string, number> = {};
      for (const g of allGRNs) {
        for (const item of g.items) {
          totalReceived[item.sku] = (totalReceived[item.sku] || 0) + item.received;
        }
      }

      // Check if all PO items are fulfilled
      hasVariance = po.items.some((item: any) => {
        const received = totalReceived[item.sku] || 0;
        return item.qty !== received;
      });

      await PurchaseOrder.findOneAndUpdate(
        { id: grnData.poId },
        { status: hasVariance ? "Pending" : "Fulfilled" },
        { session }
      );
    }

    // 3. Update Inventory and Create Inward entries
    for (const item of grnData.items) {
      // Update Inventory
      const inv = await Inventory.findOneAndUpdate(
        { sku: item.sku },
        { $inc: { liveStock: item.received } },
        { session, new: true }
      );

      // Create Inward entry
      const inward = new Inward({
        id: `INW-${Date.now()}-${item.sku}`,
        sku: item.sku,
        name: item.name,
        qty: item.received,
        unit: inv?.unit || "NOS",
        date: grn.date,
        challanNo: grn.challan,
        mrNo: grn.mrNo,
        supplier: grn.vendor,
        type: "GRN",
        grnRef: grn.id,
        project: grn.project,
        category: inv?.category,
        materialPhotoUrl: grn.materialImageUrl,
      });
      await inward.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Broadcast updates
    broadcast({ type: 'DATA_UPDATED', path: 'grn' });
    broadcast({ type: 'DATA_UPDATED', path: 'pos' });
    broadcast({ type: 'DATA_UPDATED', path: 'inventory' });
    broadcast({ type: 'DATA_UPDATED', path: 'inward' });

    // Add notifications
    broadcast({ 
      type: 'NOTIFICATION', 
      message: `New GRN Created: ${grn.id} for PO: ${grn.poId}`,
      severity: 'success',
      senderId: (req as any).user?._id
    });

    if (hasVariance) {
      broadcast({ 
        type: 'NOTIFICATION', 
        message: `GRN Variance Detected for PO: ${grn.poId}. Status remains Pending.`,
        severity: 'warning',
        senderId: (req as any).user?._id
      });
    }

    res.status(201).json({ success: true, data: grn });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('GRN creation failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Custom GRN Update with PO status and Inventory update
router.put('/grn/:id(*)', protect, async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id || req.params[0];
    const grnData = req.body;
    
    // 1. Get the old GRN to calculate inventory difference
    const oldGRN = await GRN.findOne({ id: id });
    if (!oldGRN) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    // 2. Update the GRN
    const updatedGRN = await GRN.findOneAndUpdate(
      { id: id },
      grnData,
      { new: true, session }
    );

    // 3. Recalculate PO status based on all GRNs for this PO
    const allGRNs = await GRN.find({ poId: grnData.poId }, null, { session });
    const po = await PurchaseOrder.findOne({ id: grnData.poId }, null, { session });
    
    if (po) {
      // Calculate total received across all GRNs
      const totalReceived: Record<string, number> = {};
      for (const g of allGRNs) {
        for (const item of g.items) {
          totalReceived[item.sku] = (totalReceived[item.sku] || 0) + item.received;
        }
      }

      // Check if all PO items are fulfilled
      const hasVariance = po.items.some((item: any) => {
        const received = totalReceived[item.sku] || 0;
        return item.qty !== received;
      });

      await PurchaseOrder.findOneAndUpdate(
        { id: grnData.poId },
        { status: hasVariance ? "Pending" : "Fulfilled" },
        { session }
      );
    }

    // 4. Adjust Inventory and Inward records based on difference
    for (const item of grnData.items) {
      const oldItem = oldGRN.items.find((i: any) => i.sku === item.sku);
      const diff = item.received - (oldItem ? (oldItem as any).received : 0);
      
      if (diff !== 0) {
        await Inventory.findOneAndUpdate(
          { sku: item.sku },
          { $inc: { liveStock: diff } },
          { session }
        );
      }

      // Update or Create Inward record
      if (oldItem) {
        await Inward.findOneAndUpdate(
          { grnRef: id, sku: item.sku },
          { qty: item.received, date: grnData.date, challanNo: grnData.challan, mrNo: grnData.mrNo },
          { session }
        );
      } else {
        // New item added during edit
        const inv = await Inventory.findOne({ sku: item.sku }, null, { session });
        const inward = new Inward({
          id: `INW-${Date.now()}-${item.sku}`,
          sku: item.sku,
          name: item.name,
          qty: item.received,
          unit: inv?.unit || "NOS",
          date: grnData.date,
          challanNo: grnData.challan,
          mrNo: grnData.mrNo,
          supplier: grnData.vendor,
          type: "GRN",
          grnRef: id,
          materialPhotoUrl: grnData.materialImageUrl,
        });
        await inward.save({ session });
      }
    }

    // Remove Inward records for items removed from GRN
    const currentSkus = grnData.items.map((i: any) => i.sku);
    const removedItems = oldGRN.items.filter((i: any) => !currentSkus.includes(i.sku));
    for (const item of removedItems) {
      await Inward.deleteOne({ grnRef: id, sku: item.sku }, { session });
      // Also decrease inventory for removed items
      await Inventory.findOneAndUpdate(
        { sku: item.sku },
        { $inc: { liveStock: -(item as any).received } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    broadcast({ type: 'DATA_UPDATED', path: 'grn' });
    broadcast({ type: 'DATA_UPDATED', path: 'pos' });
    broadcast({ type: 'DATA_UPDATED', path: 'inventory' });

    broadcast({ 
      type: 'NOTIFICATION', 
      message: `GRN Updated: ${id}`,
      severity: 'info',
      senderId: (req as any).user?._id
    });

    res.json({ success: true, data: updatedGRN });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
});

// Custom GRN Deletion with PO status and Inventory update
router.delete('/grn/:id(*)', protect, async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id || req.params[0];
    
    // 1. Get the GRN to adjust inventory
    const grn = await GRN.findOne({ id: id });
    if (!grn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'GRN not found' });
    }

    // 2. Decrease Inventory
    for (const item of grn.items) {
      await Inventory.findOneAndUpdate(
        { sku: item.sku },
        { $inc: { liveStock: -item.received } },
        { session }
      );
    }

    // 3. Delete Inward records
    await Inward.deleteMany({ grnRef: grn.id }, { session });

    // 4. Delete the GRN
    await GRN.findOneAndDelete({ id: id }, { session });

    // 5. Recalculate PO status
    // Get all remaining GRNs for this PO
    const remainingGRNs = await GRN.find({ poId: grn.poId }, null, { session });
    const po = await PurchaseOrder.findOne({ id: grn.poId }, null, { session });
    
    if (po) {
      if (remainingGRNs.length === 0) {
        // No GRNs left, reset to Approved
        await PurchaseOrder.findOneAndUpdate(
          { id: grn.poId },
          { status: "Approved" },
          { session }
        );
      } else {
        // Calculate total received across all remaining GRNs
        const totalReceived: Record<string, number> = {};
        for (const g of remainingGRNs) {
          for (const item of g.items) {
            totalReceived[item.sku] = (totalReceived[item.sku] || 0) + item.received;
          }
        }

        // Check if all PO items are fulfilled
        const hasVariance = po.items.some((item: any) => {
          const received = totalReceived[item.sku] || 0;
          return item.qty !== received;
        });

        await PurchaseOrder.findOneAndUpdate(
          { id: grn.poId },
          { status: hasVariance ? "Pending" : "Fulfilled" },
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    broadcast({ type: 'DATA_UPDATED', path: 'grn' });
    broadcast({ type: 'DATA_UPDATED', path: 'pos' });
    broadcast({ type: 'DATA_UPDATED', path: 'inventory' });
    broadcast({ type: 'DATA_UPDATED', path: 'inward' });

    broadcast({ 
      type: 'NOTIFICATION', 
      message: `GRN Deleted: ${id}`,
      severity: 'warning',
      senderId: (req as any).user?._id
    });

    res.json({ success: true, message: 'GRN deleted and PO status updated' });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
});

createCrudRoutes(Inventory, 'inventory');
createCrudRoutes(Catalogue, 'catalogue');
createCrudRoutes(Vendor, 'vendors');
createCrudRoutes(PurchaseOrder, 'pos');
createCrudRoutes(MaterialPlan, 'planning');
createCrudRoutes(GRN, 'grn');
createCrudRoutes(Inward, 'inward');
createCrudRoutes(Outward, 'outward');
createCrudRoutes(InwardReturn, 'inward-returns');
createCrudRoutes(OutwardReturn, 'outward-returns');
createCrudRoutes(WriteOff, 'writeoffs');
createCrudRoutes(StockCheckReport, 'stock-check-reports');

// Stock Check Audit endpoint
router.post('/stock-check', protect, async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { report } = req.body;
    
    // 1. Create the report
    const newReport = new StockCheckReport({
      ...report,
      performedBy: req.user.name
    });
    await newReport.save({ session });

    // 2. Update inventory for each item
    for (const item of report.items) {
      await Inventory.findOneAndUpdate(
        { sku: item.sku },
        { liveStock: item.physicalStock },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    broadcast({ type: 'DATA_UPDATED', path: 'inventory' });
    broadcast({ type: 'DATA_UPDATED', path: 'stock-check-reports' });

    broadcast({ 
      type: 'NOTIFICATION', 
      message: `Stock Check Audit Completed by ${req.user.name}`,
      severity: 'success',
      senderId: (req as any).user?._id
    });

    res.status(201).json({ success: true, data: newReport });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stats endpoint for dashboard
router.get('/stats', protect, async (req, res) => {
  try {
    const [
      totalSKUs,
      inStock,
      reusable,
      pendingPOs,
      lowStockItems,
      pendingWriteOffs,
      outOfStock,
      categories
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ liveStock: { $gt: 0 } }),
      Inventory.countDocuments({ 
        condition: { $in: ["Good", "Needs Repair"] }, 
        liveStock: { $gt: 0 } 
      }),
      PurchaseOrder.countDocuments({ 
        status: { $in: ["Pending L1", "Pending L2"] } 
      }),
      Inventory.aggregate([
        {
          $lookup: {
            from: 'catalogues',
            localField: 'sku',
            foreignField: 'sku',
            as: 'catalogue'
          }
        },
        { $unwind: '$catalogue' },
        {
          $project: {
            isLowStock: { $lte: ['$liveStock', '$catalogue.minStock'] }
          }
        },
        { $match: { isLowStock: true } },
        { $count: 'count' }
      ]),
      WriteOff.countDocuments({ status: "Pending" }),
      Inventory.countDocuments({ liveStock: 0 }),
      Inventory.distinct('category')
    ]);

    const lowStockCount = lowStockItems.length > 0 ? lowStockItems[0].count : 0;

    res.json({
      success: true,
      data: {
        totalSKUs,
        inStock,
        reusable,
        pendingPOs,
        lowStockCount,
        pendingWriteOffs,
        outOfStock,
        categoriesCount: categories.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Settings Routes
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can update settings' });
    }
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    broadcast({ type: 'DATA_UPDATED', path: 'settings' });
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed data endpoint
router.post('/seed', protect, async (req, res) => {
  try {
    const { SEED_INVENTORY, SEED_CATALOGUE, SEED_VENDORS, SEED_POS } = req.body;
    
    await Inventory.deleteMany({});
    await Inventory.insertMany(SEED_INVENTORY);
    
    await Catalogue.deleteMany({});
    await Catalogue.insertMany(SEED_CATALOGUE);
    
    await Vendor.deleteMany({});
    await Vendor.insertMany(SEED_VENDORS);
    
    await PurchaseOrder.deleteMany({});
    await PurchaseOrder.insertMany(SEED_POS);
    
    broadcast({ type: 'DATA_UPDATED', path: 'all' });
    res.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Catch-all for unknown API routes
router.use((req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

export default router;
