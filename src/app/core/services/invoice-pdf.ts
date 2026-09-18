import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { SaleResponse, SaleItemResponse } from '../models/sale';

@Injectable({
  providedIn: 'root'
})
export class InvoicePdfService {

  generateInvoicePdf(
    sale: SaleResponse,
    autoDownload: boolean = true
  ): jsPDF {

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('HomeDesk', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);

    doc.text(
      'Mobiliario de Diseno & Gestion Comercial S.A.',
      margin,
      26
    );

    doc.text(
      'NIT: 9876543-2 | PBX: (+502) 2200-0000 | info@homedesk.com',
      margin,
      31
    );

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);

    doc.text(
      'FACTURA',
      pageWidth - margin,
      19,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text(
      sale.invoiceNumber || 'FACT-001-00000',
      pageWidth - margin,
      25,
      { align: 'right' }
    );

    doc.setTextColor(100, 100, 100);

    doc.text(
      `Fecha: ${this.formatDate(sale.saleDate || sale.createdAt)}`,
      pageWidth - margin,
      31,
      { align: 'right' }
    );

    doc.setDrawColor(210, 210, 210);
    doc.line(margin, 37, pageWidth - margin, 37);

    let currentY = 46;

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text('DATOS DEL CLIENTE', margin, currentY);

    currentY += 7;

    const clientName =
      sale.customer?.fullName || 'Consumidor Final';

    const clientTax =
      sale.customer?.taxNumber || 'C/F';

    const clientPhone =
      sale.customer?.phone || 'No registrado';

    const clientEmail =
      sale.customer?.email || 'No registrado';

    const clientAddress =
      sale.customer?.address || 'Ciudad de Guatemala';

    const seller =
      sale.user?.fullName || 'Sistema';

    const rightColumn =
      margin + contentWidth / 2 + 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);

    doc.text(`Cliente: ${clientName}`, margin, currentY);
    doc.text(`NIT / Identificacion: ${clientTax}`, margin, currentY + 6);
    doc.text(`Direccion: ${clientAddress}`, margin, currentY + 12);

    doc.text(`Telefono: ${clientPhone}`, rightColumn, currentY);
    doc.text(`Correo: ${clientEmail}`, rightColumn, currentY + 6);
    doc.text(`Vendedor: ${seller}`, rightColumn, currentY + 12);

    currentY += 23;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, contentWidth, 8, 'F');

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    const colCant = margin + 4;
    const colDesc = margin + 22;
    const colPrecio = pageWidth - margin - 52;
    const colSubtotal = pageWidth - margin - 4;

    doc.text('CANT.', colCant, currentY + 5.5);

    doc.text(
      'DESCRIPCION',
      colDesc,
      currentY + 5.5
    );

    doc.text(
      'PRECIO UNIT.',
      colPrecio,
      currentY + 5.5,
      { align: 'right' }
    );

    doc.text(
      'SUBTOTAL',
      colSubtotal,
      currentY + 5.5,
      { align: 'right' }
    );

    currentY += 8;

    const items: SaleItemResponse[] = sale.items || [];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);

    for (const item of items) {

      if (currentY > 255) {

        this.addFooter(doc);

        doc.addPage();

        currentY = 20;

        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, contentWidth, 8, 'F');

        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);

        doc.text('CANT.', colCant, currentY + 5.5);
        doc.text('DESCRIPCION', colDesc, currentY + 5.5);

        doc.text(
          'PRECIO UNIT.',
          colPrecio,
          currentY + 5.5,
          { align: 'right' }
        );

        doc.text(
          'SUBTOTAL',
          colSubtotal,
          currentY + 5.5,
          { align: 'right' }
        );

        currentY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
      }

      const quantity = item.quantity || 1;

      const productName =
        item.product?.name || 'Producto';

      const description =
        productName.length > 55
          ? productName.substring(0, 52) + '...'
          : productName;

      const unitPrice =
        this.formatCurrency(item.unitPrice || 0);

      const subtotal =
        this.formatCurrency(item.subtotal || 0);

      doc.setTextColor(50, 50, 50);

      doc.text(
        String(quantity),
        colCant + 2,
        currentY + 5
      );

      doc.text(
        description,
        colDesc,
        currentY + 5
      );

      doc.text(
        unitPrice,
        colPrecio,
        currentY + 5,
        { align: 'right' }
      );

      doc.text(
        subtotal,
        colSubtotal,
        currentY + 5,
        { align: 'right' }
      );

      doc.setDrawColor(225, 225, 225);

      doc.line(
        margin,
        currentY + 8,
        pageWidth - margin,
        currentY + 8
      );

      currentY += 8;
    }

    currentY += 8;

    if (sale.payments && sale.payments.length > 0) {

      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      doc.text(
        'INFORMACION DE PAGO',
        margin,
        currentY
      );

      currentY += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);

      for (const payment of sale.payments) {

        const method =
          payment.paymentMethod?.name ||
          'Metodo de pago';

        const reference =
          payment.referenceNumber
            ? ` | Ref: ${payment.referenceNumber}`
            : '';

        const amount =
          this.formatCurrency(payment.amount || 0);

        doc.text(
          `${method}${reference}: ${amount}`,
          margin,
          currentY
        );

        currentY += 5;
      }

      currentY += 5;
    }

    const summaryWidth = 70;
    const summaryX =
      pageWidth - margin - summaryWidth;

    if (currentY > 245) {
      this.addFooter(doc);

      doc.addPage();

      currentY = 25;
    }

    doc.setDrawColor(210, 210, 210);

    doc.line(
      summaryX,
      currentY,
      pageWidth - margin,
      currentY
    );

    currentY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);

    doc.text(
      'Subtotal:',
      summaryX,
      currentY
    );

    doc.setTextColor(40, 40, 40);

    doc.text(
      this.formatCurrency(sale.subtotal || 0),
      pageWidth - margin,
      currentY,
      { align: 'right' }
    );

    currentY += 6;

    doc.setTextColor(90, 90, 90);

    doc.text(
      'IVA (12%):',
      summaryX,
      currentY
    );

    doc.setTextColor(40, 40, 40);

    doc.text(
      this.formatCurrency(sale.taxAmount || 0),
      pageWidth - margin,
      currentY,
      { align: 'right' }
    );

    currentY += 7;

    doc.setDrawColor(210, 210, 210);

    doc.line(
      summaryX,
      currentY,
      pageWidth - margin,
      currentY
    );

    currentY += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);

    doc.text(
      'TOTAL:',
      summaryX,
      currentY
    );

    doc.text(
      this.formatCurrency(sale.totalAmount || 0),
      pageWidth - margin,
      currentY,
      { align: 'right' }
    );

    this.addFooter(doc);

    if (autoDownload) {

      const filename =
        `Factura-${sale.invoiceNumber || 'HD'}.pdf`;

      doc.save(filename);
    }

    return doc;
  }

  private addFooter(doc: jsPDF): void {

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const margin = 15;

    doc.setDrawColor(220, 220, 220);

    doc.line(
      margin,
      pageHeight - 17,
      pageWidth - margin,
      pageHeight - 17
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    doc.setTextColor(120, 120, 120);

    doc.text(
      'Gracias por su preferencia.',
      pageWidth / 2,
      pageHeight - 11,
      { align: 'center' }
    );

    doc.text(
      'HomeDesk ERP - Sistema Integrado de Gestion Comercial',
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  private formatCurrency(value: number): string {

    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    })
      .format(value)
      .replace('GTQ', 'Q');
  }

  private formatDate(isoDate?: string): string {

    if (!isoDate) {
      return '-';
    }

    try {

      const date = new Date(isoDate);

      return date.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    } catch {

      return isoDate;
    }
  }
}