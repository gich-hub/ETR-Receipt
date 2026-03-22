import React, { useState, useEffect } from 'react';
import { getReceipts, Receipt } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Export() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  async function loadReceipts() {
    try {
      const data = await getReceipts();
      setReceipts(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to load receipts", error);
    } finally {
      setLoading(false);
    }
  }

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Expense Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table
    const tableData = receipts.map(r => [
      r.date,
      r.merchantName,
      r.category,
      `${r.currency} ${r.totalAmount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Date', 'Merchant', 'Category', 'Amount']],
      body: tableData,
      startY: 40,
    });

    // Add Images (This is tricky with blobs in browser, let's try)
    let y = (doc as any).lastAutoTable.finalY + 10;
    
    for (const receipt of receipts) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`Receipt: ${receipt.merchantName} (${receipt.date})`, 14, y);
      y += 10;

      try {
        // Convert blob to base64 for PDF
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(receipt.imageBlob);
        });

        // Add image
        // We need to scale it to fit
        const imgProps = doc.getImageProperties(base64);
        const pdfWidth = doc.internal.pageSize.getWidth() - 28;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Check if image fits on page
        if (y + pdfHeight > 280) {
          doc.addPage();
          y = 20;
        }

        doc.addImage(base64, 'JPEG', 14, y, pdfWidth, pdfHeight);
        y += pdfHeight + 10;
      } catch (e) {
        console.error("Failed to add image for receipt", receipt.id, e);
        doc.text("[Image Error]", 14, y);
        y += 10;
      }
    }

    doc.save("expenses.pdf");
  };

  const generateCSV = () => {
    const headers = ["Date", "Merchant", "Category", "Currency", "Amount", "Status"];
    const rows = receipts.map(r => [
      r.date,
      `"${r.merchantName.replace(/"/g, '""')}"`, // Escape quotes
      r.category,
      r.currency,
      r.totalAmount.toFixed(2),
      r.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-6 py-4 border-b flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Export Data</h1>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-900">Ready to Export</h3>
            <p className="text-sm text-blue-700 mt-1">
              {receipts.length} receipts found.
            </p>
          </div>

          <Button onClick={generatePDF} className="w-full justify-start h-14" variant="outline">
            <FileText className="w-5 h-5 mr-3 text-red-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Download PDF Report</div>
              <div className="text-xs text-gray-500">Includes receipt images</div>
            </div>
          </Button>

          <Button onClick={generateCSV} className="w-full justify-start h-14" variant="outline">
            <Download className="w-5 h-5 mr-3 text-green-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Download CSV</div>
              <div className="text-xs text-gray-500">For Excel or Sheets</div>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}
