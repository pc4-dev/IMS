import React, { useState } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, Modal } from "../components/ui";
import { FileText, Download, Eye, Calendar, User, Tag } from "lucide-react";
import { StockCheckReport } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const StockCheckReports = () => {
  const { stockCheckReports } = useAppStore();
  const [selectedReport, setSelectedReport] = useState<StockCheckReport | null>(null);

  const downloadPDF = (report: StockCheckReport) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Stock Check Audit Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report ID: ${report.id}`, 14, 32);
    doc.text(`Date: ${new Date(report.date).toLocaleString()}`, 14, 38);
    doc.text(`Category: ${report.category}`, 14, 44);
    doc.text(`Performed By: ${report.performedBy}`, 14, 50);
    
    // Table
    const tableData = report.items.map(item => [
      item.sku,
      item.name,
      item.systemStock,
      item.physicalStock,
      item.variance,
      item.unit
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [['SKU', 'Item Name', 'System Stock', 'Physical Count', 'Variance', 'Unit']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [26, 26, 46] }
    });
    
    doc.save(`Stock_Check_Report_${report.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Check Reports"
        sub="History of physical inventory audits"
      />

      {stockCheckReports.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Reports Found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Complete a physical stock check audit to generate your first report.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockCheckReports.map((report) => (
            <Card key={report.id} className="p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  {report.status}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{report.category} Audit</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{report.id}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(report.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <User className="w-3.5 h-3.5" />
                  {report.performedBy}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Tag className="w-3.5 h-3.5" />
                  {report.items.length} Items Audited
                </div>
              </div>
              
              <div className="flex gap-2">
                <Btn
                  label="View"
                  icon={Eye}
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setSelectedReport(report)}
                />
                <Btn
                  label="PDF"
                  icon={Download}
                  className="flex-1"
                  onClick={() => downloadPDF(report)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedReport && (
        <Modal
          title={`Audit Report: ${selectedReport.id}`}
          onClose={() => setSelectedReport(null)}
          wide
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedReport.date).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReport.category}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Performed By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReport.performedBy}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Items</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReport.items.length}</p>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400">SKU</th>
                    <th className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400">Item Name</th>
                    <th className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400 text-right">System</th>
                    <th className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400 text-right">Physical</th>
                    <th className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {selectedReport.items.map((item) => (
                    <tr key={item.sku} className="bg-white dark:bg-gray-900">
                      <td className="px-4 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{item.sku}</td>
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{item.systemStock} {item.unit}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white">{item.physicalStock} {item.unit}</td>
                      <td className={`px-4 py-2 text-right font-bold ${item.variance > 0 ? "text-blue-600 dark:text-blue-400" : item.variance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            <div className="flex justify-end gap-3">
              <Btn label="Close" outline onClick={() => setSelectedReport(null)} />
              <Btn label="Download PDF" icon={Download} onClick={() => downloadPDF(selectedReport)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
