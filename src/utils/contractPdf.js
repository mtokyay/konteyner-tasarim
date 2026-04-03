import jsPDF from 'jspdf';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const FOOTER_HEIGHT = 12;

/**
 * Generate a professional contract PDF for container house sales
 * @param {Object} contractData - Contract information
 * @returns {jsPDF} PDF document
 */
export function generateContractPdf(contractData) {
  const doc = new jsPDF('p', 'mm', 'A4');
  let currentPage = 1;
  let totalPages = 1; // Will be determined after content generation

  const {
    company,
    customer,
    contract,
    design,
    payments,
    notes,
  } = contractData;

  // Helper functions
  const getPageCount = () => doc.internal.pages.length - 1;
  const newPage = () => {
    doc.addPage();
    currentPage++;
  };

  const addHeader = () => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);

    // Logo placeholder / Company header
    const headerTop = MARGIN_TOP;

    // Company name (large, bold)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, PAGE_WIDTH / 2, headerTop + 8, { align: 'center' });

    // Company details on the right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const rightX = PAGE_WIDTH - MARGIN_RIGHT;
    let detailY = headerTop + 15;

    doc.text(`Adres: ${company.address}`, rightX, detailY, { align: 'right' });
    detailY += 4;
    doc.text(`Tel: ${company.phone}`, rightX, detailY, { align: 'right' });
    detailY += 4;
    doc.text(`E-posta: ${company.email}`, rightX, detailY, { align: 'right' });
    detailY += 4;
    doc.text(`Vergi Dairesi: ${company.taxOffice}`, rightX, detailY, { align: 'right' });
    detailY += 4;
    doc.text(`Vergi No: ${company.taxNumber}`, rightX, detailY, { align: 'right' });
    detailY += 4;
    doc.text(`IBAN: ${company.iban}`, rightX, detailY, { align: 'right' });

    // Separator line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, MARGIN_TOP + 33, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 33);
  };

  const addFooter = (pageNum, totalPages) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    const footerY = PAGE_HEIGHT - MARGIN_BOTTOM + 2;
    doc.line(MARGIN_LEFT, footerY - 3, PAGE_WIDTH - MARGIN_RIGHT, footerY - 3);

    doc.text(`SATICI: ${company.name}`, MARGIN_LEFT, footerY);
    doc.text(`Sayfa ${pageNum}/${totalPages}`, PAGE_WIDTH / 2, footerY, { align: 'center' });
    doc.text(`ALICI: ${customer.firstName} ${customer.lastName}`, PAGE_WIDTH - MARGIN_RIGHT, footerY, { align: 'right' });
  };

  // PAGE 1: Header + Contract Info
  addHeader();

  let contentY = MARGIN_TOP + 38;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KONTEYNER YAPI SATIŞ SÖZLEŞMESİ', PAGE_WIDTH / 2, contentY, { align: 'center' });
  contentY += 10;

  // Contract number and date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sözleşme No: ${contract.contractNumber}`, MARGIN_LEFT, contentY);
  contentY += 5;
  doc.text(`Sözleşme Tarihi: ${formatDate(contract.contractDate)}`, MARGIN_LEFT, contentY);
  contentY += 10;

  // Two-column layout: SATICI | ALICI
  const colWidth = (CONTENT_WIDTH - 5) / 2;
  const boxX1 = MARGIN_LEFT;
  const boxX2 = MARGIN_LEFT + colWidth + 5;
  const boxTop = contentY;

  // SATICI box
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(boxX1, boxTop, colWidth, 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SATICI (Satın Veren Taraf)', boxX1 + 2, boxTop + 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let boxContentY = boxTop + 12;
  doc.text(`Unvan: ${company.name}`, boxX1 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`Adres: ${company.address}`, boxX1 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`Tel: ${company.phone}`, boxX1 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`E-posta: ${company.email}`, boxX1 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`Yetkili: ${company.authorizedName}`, boxX1 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`Ünvan: ${company.authorizedTitle}`, boxX1 + 2, boxContentY);

  // ALICI box
  doc.rect(boxX2, boxTop, colWidth, 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ALICI (Satın Alan Taraf)', boxX2 + 2, boxTop + 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  boxContentY = boxTop + 12;
  doc.text(`Adı Soyadı: ${customer.firstName} ${customer.lastName}`, boxX2 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`Adres: ${customer.address}`, boxX2 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`Tel: ${customer.phone}`, boxX2 + 2, boxContentY);
  boxContentY += 4;
  doc.text(`E-posta: ${customer.email}`, boxX2 + 2, boxContentY);

  addFooter(1, 4);
  newPage();

  // PAGE 2: Technical Specifications
  addHeader();
  contentY = MARGIN_TOP + 38;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TEKNİK ŞARTNAME', PAGE_WIDTH / 2, contentY, { align: 'center' });
  contentY += 10;

  // Specifications table
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const tableLeft = MARGIN_LEFT;
  const tableWidth = CONTENT_WIDTH;
  const cellHeight = 7;
  const colWidths = [40, 50, 50, 50, 50];

  // Header row
  doc.setFillColor(220, 220, 220);
  let tableY = contentY;

  const headers = ['Boyut (m)', 'Panel Tipi', 'Çatı Tipi', 'Birleşim Tipi', 'Veranda'];
  let xPos = tableLeft;

  headers.forEach((header, idx) => {
    doc.rect(xPos, tableY, colWidths[idx], cellHeight, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(header, xPos + 1, tableY + 5, { maxWidth: colWidths[idx] - 2 });
    xPos += colWidths[idx];
  });

  // Data row
  tableY += cellHeight;
  const specs = [
    `${design.width}x${design.length}x${design.height}`,
    design.panelType,
    design.roofType,
    design.combo,
    design.veranda ? 'Evet' : 'Hayır',
  ];

  doc.setFillColor(245, 245, 245);
  xPos = tableLeft;
  specs.forEach((spec, idx) => {
    doc.rect(xPos, tableY, colWidths[idx], cellHeight, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(spec, xPos + 1, tableY + 5, { maxWidth: colWidths[idx] - 2 });
    xPos += colWidths[idx];
  });

  contentY = tableY + cellHeight + 8;

  // Items summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Dahil Ürünler:', MARGIN_LEFT, contentY);
  contentY += 5;

  doc.setFont('helvetica', 'normal');
  if (design.items && design.items.length > 0) {
    design.items.forEach((item) => {
      doc.setFontSize(8);
      doc.text(`• ${item.quantity} adet ${item.name}`, MARGIN_LEFT + 5, contentY);
      contentY += 4;
    });
  }

  contentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Toplam İnşaat Alanı: ${design.totalArea} m²`, MARGIN_LEFT, contentY);

  addFooter(2, 4);
  newPage();

  // PAGE 3+: Contract Terms
  addHeader();
  contentY = MARGIN_TOP + 38;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SÖZLEŞME MADDELERİ', PAGE_WIDTH / 2, contentY, { align: 'center' });
  contentY += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (contract.terms && contract.terms.length > 0) {
    contract.terms.forEach((term, index) => {
      const termTitle = `MADDE ${index + 1}`;

      // Check if we need a new page
      if (contentY > PAGE_HEIGHT - MARGIN_BOTTOM - 20) {
        addFooter(currentPage, 4);
        newPage();
        addHeader();
        contentY = MARGIN_TOP + 38;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(termTitle, MARGIN_LEFT, contentY);
      contentY += 5;

      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(term, CONTENT_WIDTH - 10);
      lines.forEach((line) => {
        if (contentY > PAGE_HEIGHT - MARGIN_BOTTOM - 10) {
          addFooter(currentPage, 4);
          newPage();
          addHeader();
          contentY = MARGIN_TOP + 38;
        }
        doc.text(line, MARGIN_LEFT + 5, contentY);
        contentY += 4;
      });

      contentY += 3;
    });
  }

  addFooter(currentPage, 4);
  newPage();

  // PAGE 4: Payment Plan
  addHeader();
  contentY = MARGIN_TOP + 38;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ÖDEME PLANI', PAGE_WIDTH / 2, contentY, { align: 'center' });
  contentY += 10;

  // Payment summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const summaryItems = [
    ['Toplam Tutar:', formatCurrency(payments.totalPrice)],
    ['İndirim:', formatCurrency(payments.discount)],
    ['Net Tutar:', formatCurrency(payments.netPrice)],
    [`KDV (${payments.vatRate}%)`, formatCurrency(payments.vatAmount)],
  ];

  let summaryY = contentY;
  summaryItems.forEach((item) => {
    doc.text(item[0], MARGIN_LEFT, summaryY);
    doc.text(item[1], PAGE_WIDTH - MARGIN_RIGHT, summaryY, { align: 'right' });
    summaryY += 5;
  });

  // Grand total (highlighted)
  doc.setFillColor(220, 220, 220);
  doc.rect(MARGIN_LEFT, summaryY, CONTENT_WIDTH, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GENEL TOPLAM:', MARGIN_LEFT + 2, summaryY + 5);
  doc.text(formatCurrency(payments.grandTotal), PAGE_WIDTH - MARGIN_RIGHT - 2, summaryY + 5, { align: 'right' });

  contentY = summaryY + 12;

  // Installment table
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const instTableLeft = MARGIN_LEFT;
  const instTableWidth = CONTENT_WIDTH;
  const instCellHeight = 6;
  const instColWidths = [25, 80, 50, 50];

  // Header
  doc.setFillColor(200, 200, 200);
  const instHeaders = ['No', 'Açıklama', 'Tutar (TL)', 'Vade Tarihi'];
  let instXPos = instTableLeft;

  instHeaders.forEach((header, idx) => {
    doc.rect(instXPos, contentY, instColWidths[idx], instCellHeight, 'FD');
    doc.text(header, instXPos + 1, contentY + 4);
    instXPos += instColWidths[idx];
  });

  contentY += instCellHeight;

  // Installment rows
  doc.setFont('helvetica', 'normal');
  if (payments.installments && payments.installments.length > 0) {
    payments.installments.forEach((inst) => {
      doc.setFillColor(245, 245, 245);
      instXPos = instTableLeft;

      const instData = [
        inst.no.toString(),
        `Taksit ${inst.no}`,
        formatCurrency(inst.amount),
        formatDate(inst.dueDate),
      ];

      instData.forEach((data, idx) => {
        doc.rect(instXPos, contentY, instColWidths[idx], instCellHeight, 'FD');
        doc.setFontSize(8);
        doc.text(data, instXPos + 1, contentY + 4, { maxWidth: instColWidths[idx] - 2 });
        instXPos += instColWidths[idx];
      });

      contentY += instCellHeight;
    });
  }

  contentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(255, 250, 200);
  doc.rect(MARGIN_LEFT, contentY, CONTENT_WIDTH, 6, 'F');
  doc.text(`Teslim Tarihi: ${formatDate(payments.deliveryDate)}`, MARGIN_LEFT + 2, contentY + 4);

  addFooter(currentPage, 4);
  newPage();

  // PAGE 5: Signature & Notes
  addHeader();
  contentY = MARGIN_TOP + 38;

  if (notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ÖZEL ŞARTLAR VE NOTLAR', PAGE_WIDTH / 2, contentY, { align: 'center' });
    contentY += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(notes, CONTENT_WIDTH);
    noteLines.forEach((line) => {
      doc.text(line, MARGIN_LEFT, contentY);
      contentY += 4;
    });

    contentY += 5;
  }

  contentY += 10;

  // Signature text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const signatureText = `İşbu sözleşme ${formatDate(contract.contractDate)} tarihinde iki nüsha olarak düzenlenmiş ve taraflarca imzalanmıştır.`;
  const signLines = doc.splitTextToSize(signatureText, CONTENT_WIDTH);
  signLines.forEach((line) => {
    doc.text(line, PAGE_WIDTH / 2, contentY, { align: 'center' });
    contentY += 4;
  });

  contentY += 15;

  // Signature boxes
  const sigBoxWidth = (CONTENT_WIDTH - 10) / 2;
  const sigBoxHeight = 25;

  // Satici signature box
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN_LEFT, contentY, sigBoxWidth, sigBoxHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SATICI', MARGIN_LEFT + 2, contentY + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(company.name, MARGIN_LEFT + 2, contentY + 10);
  doc.text(`Yetkili: ${company.authorizedName}`, MARGIN_LEFT + 2, contentY + 14);
  doc.text('Unvan: ' + company.authorizedTitle, MARGIN_LEFT + 2, contentY + 18);

  doc.setFontSize(6);
  doc.text('İmza: ............................', MARGIN_LEFT + 2, contentY + 23);

  // Alici signature box
  doc.rect(MARGIN_LEFT + sigBoxWidth + 10, contentY, sigBoxWidth, sigBoxHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ALICI', MARGIN_LEFT + sigBoxWidth + 12, contentY + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customer.firstName} ${customer.lastName}`, MARGIN_LEFT + sigBoxWidth + 12, contentY + 10);
  doc.text(`Tel: ${customer.phone}`, MARGIN_LEFT + sigBoxWidth + 12, contentY + 14);

  doc.setFontSize(6);
  doc.text('İmza: ............................', MARGIN_LEFT + sigBoxWidth + 12, contentY + 23);

  addFooter(currentPage, 4);

  return doc;
}

/**
 * Format date as DD.MM.YYYY
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format currency as Turkish Lira
 */
function formatCurrency(amount) {
  if (!amount) return '0,00 TL';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₺', 'TL');
}
