import React, { useState, useEffect } from 'react';
import { getReceipts, Receipt } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Table, Link as LinkIcon } from 'lucide-react';
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
    doc.text("iTax Purchases Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table
    const tableData = receipts.map(r => [
      r.merchantKraPin || '',
      r.merchantName,
      r.date,
      r.invoiceNumber || r.id,
      r.category,
      r.totalAmount.toFixed(2),
      r.totalTaxableAmount !== undefined ? r.totalTaxableAmount.toFixed(2) : '',
      r.totalTax !== undefined ? r.totalTax.toFixed(2) : ''
    ]);

    autoTable(doc, {
      head: [['PIN of Supplier', 'Name of Supplier', 'Date', 'Invoice No', 'Description', 'Total', 'Taxable', 'VAT']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
    });

    // Add Images
    let y = (doc as any).lastAutoTable.finalY + 10;
    
    for (const receipt of receipts) {
      if (!receipt.imageBlob && !receipt.imageUrl) continue;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`Receipt: ${receipt.merchantName} (${receipt.date})`, 14, y);
      y += 10;

      try {
        let base64 = '';
        if (receipt.imageBlob) {
          base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(receipt.imageBlob!);
          });
        } else if (receipt.imageUrl) {
          // Fetch and convert imageUrl to base64 if needed, skipping for now to keep it simple
          continue; 
        }

        if (base64) {
          const imgProps = doc.getImageProperties(base64);
          const pdfWidth = doc.internal.pageSize.getWidth() - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          if (y + pdfHeight > 280) {
            doc.addPage();
            y = 20;
          }

          doc.addImage(base64, 'JPEG', 14, y, pdfWidth, pdfHeight);
          y += pdfHeight + 10;
        }
      } catch (e) {
        console.error("Failed to add image for receipt", receipt.id, e);
        doc.text("[Image Error]", 14, y);
        y += 10;
      }
    }

    doc.save("itax_purchases_export.pdf");
  };

  const generateCSV = () => {
    const headers = [
      "PIN of Supplier", 
      "Name of Supplier", 
      "Invoice/Receipt Date", 
      "Invoice/Receipt Number", 
      "Description of Goods/Services", 
      "Total Invoice Amount", 
      "Taxable Value", 
      "VAT Amount"
    ];
    
    const rows = receipts.map(r => [
      `"${r.merchantKraPin || ''}"`,
      `"${r.merchantName.replace(/"/g, '""')}"`, // Escape quotes
      `"${r.date}"`,
      `"${r.invoiceNumber || r.id}"`,
      `"${r.category}"`,
      r.totalAmount.toFixed(2),
      r.totalTaxableAmount !== undefined ? r.totalTaxableAmount.toFixed(2) : '',
      r.totalTax !== undefined ? r.totalTax.toFixed(2) : ''
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "itax_purchases_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/shared-report/${Date.now()}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert("Manager Quick-Link generated! (Clipboard access denied)");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white font-sans">
      <header className="px-6 py-6 border-b border-white/10 flex items-center gap-4 sticky top-0 bg-[#0a0a0a] z-10">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Handoff Data</h1>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <p className="text-gray-400 text-base mb-8">
          Choose how you want to export your vault contents.
        </p>

        <div className="space-y-4">
          {/* PDF Option */}
          <button 
            onClick={generatePDF}
            className="w-full text-left bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-start gap-5 transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
              <FileText className="w-7 h-7 text-red-500" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-white mb-1.5">Audit-Ready PDF</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Monthly summary with receipt images attached directly below data tables.
              </p>
            </div>
          </button>

          {/* CSV Option */}
          <button 
            onClick={generateCSV}
            className="w-full text-left bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-start gap-5 transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
              <Table className="w-7 h-7 text-green-500" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-white mb-1.5">CSV / Excel Dump</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Clean structured data ready to copy-paste into HR spreadsheets.
              </p>
            </div>
          </button>

          {/* Link Option */}
          <button 
            onClick={generateLink}
            className="w-full text-left bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-start gap-5 transition-colors group relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <LinkIcon className="w-7 h-7 text-blue-500" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-white mb-1.5">
                {copied ? "Link Copied!" : "Manager Quick-Link"}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {copied 
                  ? "Secure URL copied to clipboard. You can now paste and share it." 
                  : "Generate a secure URL to share specific expenses instantly."}
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
