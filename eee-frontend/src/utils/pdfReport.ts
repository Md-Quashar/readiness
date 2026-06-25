import jsPDF from 'jspdf';
import type { Question, Response as UserResponse } from '../types';

// Helper to fetch the device's public IP address
async function getPublicIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'N/A';
  } catch {
    return 'N/A';
  }
}

interface ReportData {
  applicantName: string;
  applicantEmail: string;
  labType: string;
  scope: string;
  questions: Question[];
  responses: UserResponse[];
  submittedAt?: string;
  printerFriendly?: boolean;
}

export async function generatePDFReport(data: ReportData) {
  // Fetch IP before generating the PDF
  const deviceIP = await getPublicIP();
  const reportGeneratedAt = new Date().toLocaleString('en-IN');
  const isBW = !!data.printerFriendly;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Layout constants ──────────────────────────────────────────────────────
  const pageW = 210;
  const margin = 15;                        // left & right margin
  const fullW = pageW - margin * 2;        // 180 mm — full usable width
  const rightX = margin + fullW;            // 195 mm — hard right edge
  let y = 0;

  // ── Colour palette ────────────────────────────────────────────────────────
  const black: [number, number, number] = [0, 0, 0];
  const white: [number, number, number] = [255, 255, 255];
  const primary: [number, number, number] = isBW ? black : [13, 27, 62];
  const secondary: [number, number, number] = isBW ? [60, 60, 60] : [80, 100, 180];
  const accent: [number, number, number] = isBW ? [40, 40, 40] : [30, 90, 165];
  const bgLight: [number, number, number] = isBW ? [248, 248, 248] : [242, 245, 252];
  const borderLight: [number, number, number] = isBW ? [200, 200, 200] : [220, 222, 235];
  const dividerGray: [number, number, number] = isBW ? [190, 190, 190] : [210, 215, 235];

  // ── Helpers ───────────────────────────────────────────────────────────────

  const checkPageBreak = (needed: number) => {
    if (y + needed > 272) { doc.addPage(); y = 20; }
  };

  const drawLine = (color: [number, number, number] = borderLight, lw = 0.25) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(margin, y, rightX, y);
    y += 4;
  };

  /**
   * Render text that may contain **bold** markdown markers.
   * Splits text into segments, rendering bold segments in 'bold' font style
   * and non-bold segments in the given baseStyle ('normal' or 'italic').
   * Handles word-wrapping across the full available width.
   */
  const drawRichText = (
    text: string,
    x: number,
    startY: number,
    maxW: number,
    fontSize: number,
    baseStyle: 'normal' | 'italic',
    color: [number, number, number],
    lineH: number,
  ): number => {
    // Parse text into segments: { text, bold }
    const segments: { text: string; bold: boolean }[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        segments.push({ text: text.slice(lastIdx, match.index), bold: false });
      }
      segments.push({ text: match[1], bold: true });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      segments.push({ text: text.slice(lastIdx), bold: false });
    }

    // If no bold markers found, fall back to simple rendering
    // (but still respect newlines)
    if (segments.length <= 1 && !segments[0]?.bold) {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', baseStyle);
      setTC(color);
      // Split by newlines first, then wrap each paragraph
      const paragraphs = text.split('\n');
      let py = startY;
      for (const para of paragraphs) {
        if (para.trim() === '') { py += lineH * 0.6; continue; }
        const lines = doc.splitTextToSize(para, maxW);
        checkPageBreak(lines.length * lineH);
        doc.text(lines, x, py);
        py += lines.length * lineH;
      }
      return py;
    }

    // Render segments word by word, wrapping as needed
    // and respecting \n as explicit line breaks
    let curX = x;
    let curY = startY;
    doc.setFontSize(fontSize);

    for (const seg of segments) {
      const style = seg.bold ? 'bold' : baseStyle;
      doc.setFont('helvetica', style);
      setTC(color);

      // Split by newlines first, then by words within each line
      const lines = seg.text.split('\n');
      for (let li = 0; li < lines.length; li++) {
        // If not the first line-part, force a line break
        if (li > 0) {
          curX = x;
          curY += lineH;
          checkPageBreak(lineH);
        }

        const words = lines[li].split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          const wordW = doc.getTextWidth(word);

          // If adding this word would exceed the line width, wrap
          if (curX + wordW > x + maxW && curX > x) {
            curX = x;
            curY += lineH;
            checkPageBreak(lineH);
          }

          doc.setFont('helvetica', style);
          setTC(color);
          doc.text(word, curX, curY);
          curX += wordW;
        }
      }
    }

    return curY + lineH;
  };

  const fillRect = (h: number, color: [number, number, number], x = margin, w = fullW) => {
    doc.setFillColor(...color);
    doc.rect(x, y, w, h, 'F');
  };

  const setTC = (c: [number, number, number]) => doc.setTextColor(...c);
  const setDC = (c: [number, number, number]) => doc.setDrawColor(...c);


  // ── PAGE HEADER ───────────────────────────────────────────────────────────
  if (isBW) {
    setDC(black);
    doc.setLineWidth(0.6);
    doc.rect(margin, 10, fullW, 26);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setTC(black);
    doc.text('EEE Application Readiness Check', margin + 5, 22);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setTC([60, 60, 60]);
    doc.text('Section 79A of The IT Act, 2000  |  Assessment Report', margin + 5, 30);
    y = 40;
  } else {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageW, 44, 'F');
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setTC(white);
    doc.text('EEE Application Readiness Check', margin, 17);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setTC([180, 200, 240]);
    doc.text('Section 79A of The IT Act, 2000  |  Assessment Report', margin, 26);
    doc.setFontSize(10); setTC([130, 160, 210]);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, 34);
    y = 48;
  }


  // ── APPLICANT DETAILS ─────────────────────────────────────────────────────
  // Column geometry — defined early so we can pre-compute wrapped line counts
  const labelW = 32;
  const col1Val = margin + 4 + labelW;           // value starts after label
  const col2 = margin + (fullW / 2) + 2;       // second column start
  const col2Val = col2 + labelW;                  // second value start

  // Available widths for value text in each column
  const valW1 = col2 - col1Val - 3;               // ~63 mm
  const valW2 = rightX - col2Val - 3;             // ~61 mm

  // Pre-compute wrapped lines at font size 10 so we know exact box height
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const nameLines = doc.splitTextToSize(data.applicantName || '\u2014', valW1);
  const emailLines = doc.splitTextToSize(data.applicantEmail || '\u2014', valW2);
  const labLines = doc.splitTextToSize(data.labType || '\u2014', valW1);
  const scopeLines = doc.splitTextToSize(data.scope || '\u2014', valW2);

  const DETAIL_LINE_H = 5.0;   // line height inside the details box
  const DETAIL_PAD = 5;     // vertical padding above each data row
  const DETAIL_HDR_H = 12;    // height of "APPLICANT DETAILS" label row

  // Row heights driven by whichever column has more wrapped lines
  const row1H = Math.max(nameLines.length, emailLines.length) * DETAIL_LINE_H + DETAIL_PAD;
  const row2H = Math.max(labLines.length, scopeLines.length) * DETAIL_LINE_H + DETAIL_PAD;
  const detailBoxH = DETAIL_HDR_H + row1H + row2H + 4;   // +4 bottom padding

  fillRect(detailBoxH, bgLight);
  setDC(isBW ? [160, 160, 160] : [180, 190, 220]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, fullW, detailBoxH);

  // "APPLICANT DETAILS" header label
  y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(secondary);
  doc.text('APPLICANT LABORATORY DETAILS', margin + 4, y);
  y += DETAIL_HDR_H - 8 + DETAIL_PAD;   // advance to first data row baseline

  // Row 1: Name / Email
  const r1BaseY = y;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Name:', margin + 4, r1BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(nameLines, col1Val, r1BaseY);
  doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Email:', col2, r1BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(emailLines, col2Val, r1BaseY);
  y = r1BaseY + row1H;

  // Row 2: Lab Type / Scope
  const r2BaseY = y;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Laboratory Type:', margin + 4, r2BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(labLines, col1Val, r2BaseY);
  doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Scope(s):', col2, r2BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(scopeLines, col2Val, r2BaseY);
  y = r2BaseY + row2H + 4 + 4;   // bottom padding + reduced gap before next section


  // ── ASSESSMENT SUMMARY ────────────────────────────────────────────────────
  const answered = data.responses.length;
  const yesCount = data.responses.filter(r => r.answer === 'yes').length;
  const noCount = answered - yesCount;
  const pct = answered ? Math.round((yesCount / answered) * 100) : 0;
  const isEligible = pct === 100;

  const eligibleColor: [number, number, number] = isBW ? black : [0, 120, 80];
  const notEligColor: [number, number, number] = isBW ? black : [180, 30, 30];
  const resultColor = isEligible ? eligibleColor : notEligColor;
  const resultBg: [number, number, number] = isBW ? [240, 240, 240] : (isEligible ? [235, 255, 245] : [255, 240, 240]);
  const resultBorder: [number, number, number] = isBW ? [150, 150, 150] : (isEligible ? [0, 160, 100] : [200, 50, 50]);

  // ── Heights for each row so we can draw the outer border first ──────────
  const ROW1_H = 18;   // stats row
  const ROW2_H = 14;   // result row
  const HDR_H = 11;   // "ASSESSMENT SUMMARY" header bar

  // Collect non-compliant questions for the table
  const nonCompliantItems: { qNum: number; section: string; questionText: string }[] = [];
  {
    let globalIdx = 0;
    const allSections = [...new Set(data.questions.map(q => q.question_section).filter(Boolean))];
    allSections.forEach(sec => {
      const secQs = data.questions.filter(q => q.question_section === sec);
      secQs.forEach(q => {
        globalIdx++;
        const resp = data.responses.find(r => r.question === q.id);
        if (resp && resp.answer !== 'yes') {
          nonCompliantItems.push({ qNum: globalIdx, section: sec, questionText: q.question });
        }
      });
    });
  }

  // Pre-calculate non-compliant table height
  const TABLE_ROW_H = 7;
  const TABLE_HDR_H = 8;
  const ncTableH = !isEligible && nonCompliantItems.length > 0
    ? TABLE_HDR_H + nonCompliantItems.length * TABLE_ROW_H
    : 0;
  const BOX_H = HDR_H + ROW1_H + ROW2_H + ncTableH;

  checkPageBreak(BOX_H + 6);

  const boxTop = y;

  // ── Outer border around the entire summary box ────────────────────────
  setDC(isBW ? black : [160, 170, 210]);
  doc.setLineWidth(0.4);
  doc.rect(margin, boxTop, fullW, BOX_H);

  // ── Header bar ───────────────────────────────────────────────────────
  const summaryBg: [number, number, number] = isBW ? [220, 220, 220] : primary;
  const summaryFg: [number, number, number] = isBW ? black : white;
  fillRect(HDR_H, summaryBg);
  y += 7.5;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(summaryFg);
  doc.text('ASSESSMENT SUMMARY', margin + 4, y);
  y += HDR_H - 7.5;   // advance to end of header

  // ── Row 1: Stats ──────────────────────────────────────────────────────
  const row1Top = y;
  fillRect(ROW1_H, bgLight);

  // internal horizontal divider at bottom of row 1
  setDC(isBW ? [180, 180, 180] : [200, 208, 235]);
  doc.setLineWidth(0.25);
  doc.line(margin, row1Top + ROW1_H, margin + fullW, row1Top + ROW1_H);

  const statsGap = fullW / 4;
  const stats: [string, string][] = [
    ['Total Answered', `${answered}`],
    ['Compliant (Yes)', `${yesCount}`],
    ['Non-Compliant (No)', `${noCount}`],
    ['Overall Score', `${pct}%`],
  ];

  // vertical column separators inside row 1
  setDC(isBW ? [200, 200, 200] : [210, 218, 240]);
  doc.setLineWidth(0.2);
  for (let c = 1; c < 4; c++) {
    const cx = margin + c * statsGap;
    doc.line(cx, row1Top, cx, row1Top + ROW1_H);
  }

  stats.forEach(([label, value], i) => {
    const sx = margin + i * statsGap + statsGap / 2;
    const vy = row1Top + 7;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    setTC(isBW ? black : secondary);
    doc.text(value, sx, vy, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    setTC(isBW ? [70, 70, 70] : [100, 110, 140]);
    doc.text(label, sx, vy + 5, { align: 'center' });
  });

  y = row1Top + ROW1_H;

  // ── Row 2: Result ─────────────────────────────────────────────────────
  const row2Top = y;
  fillRect(ROW2_H, resultBg);

  // bold left accent bar on result row
  setDC(resultBorder);
  doc.setLineWidth(1.2);
  doc.line(margin, row2Top, margin, row2Top + ROW2_H);
  doc.setLineWidth(0.4);   // reset

  // "RESULT" sub-label
  y = row2Top + 5;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  setTC(isBW ? [90, 90, 90] : [110, 120, 155]);
  doc.text('RESULT', margin + 5, y);
  y += 5;

  // Verdict text
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(resultColor);
  const resultText = isEligible
    ? 'Eligible for EEE Application'
    : 'Not Eligible for EEE Application';
  doc.text(resultText, margin + 5, y);

  y = row2Top + ROW2_H;

  // ── Non-Compliant Questions Table ─────────────────────────────────────
  if (!isEligible && nonCompliantItems.length > 0) {
    const tableTop = y;

    // Table header background
    const tblHdrBg: [number, number, number] = isBW ? [210, 210, 210] : [30, 55, 120];
    const tblHdrFg: [number, number, number] = isBW ? black : white;
    fillRect(TABLE_HDR_H, tblHdrBg);

    // Column layout: S.No | Q.No | Section | Question | Status
    const colSno = margin;          // 10mm
    const colQno = margin + 12;     // 12mm
    const colSec = margin + 24;     // 40mm
    const colQ = margin + 64;     // 96mm — largest column
    const colSt = margin + 160;    // 20mm

    // Header text
    y += 5.5;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setTC(tblHdrFg);
    doc.text('S.No', colSno + 1, y);
    doc.text('Q.No', colQno + 1, y);
    doc.text('Section', colSec + 1, y);
    doc.text('Question', colQ + 1, y);
    doc.text('Status', colSt + 1, y);
    y = tableTop + TABLE_HDR_H;

    // Table rows
    nonCompliantItems.forEach((item, idx) => {
      const rowY = y;
      const rowBg: [number, number, number] = idx % 2 === 0
        ? (isBW ? [248, 248, 248] : [250, 242, 242])
        : (isBW ? [255, 255, 255] : [255, 248, 248]);
      fillRect(TABLE_ROW_H, rowBg);

      y += 5;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [40, 40, 60]);
      doc.text(`${idx + 1}`, colSno + 1, y);
      doc.text(`Q${item.qNum}`, colQno + 1, y);

      // Truncate section to fit
      const secText = item.section.length > 22 ? item.section.substring(0, 20) + '…' : item.section;
      doc.text(secText, colSec + 1, y);

      // Truncate question to fit
      const maxQW = colSt - colQ - 2;
      const qText = doc.splitTextToSize(item.questionText, maxQW);
      doc.text(qText[0] + (qText.length > 1 ? '…' : ''), colQ + 1, y);

      // Status pill
      doc.setFont('helvetica', 'bold');
      setTC(isBW ? black : [180, 40, 40]);
      doc.text('NO', colSt + 5, y);

      y = rowY + TABLE_ROW_H;
    });

    // Table borders — vertical lines
    setDC(isBW ? [180, 180, 180] : [200, 200, 220]);
    doc.setLineWidth(0.2);
    const tblBottom = tableTop + TABLE_HDR_H + nonCompliantItems.length * TABLE_ROW_H;
    [colQno, colSec, colQ, colSt].forEach(cx => {
      doc.line(cx, tableTop, cx, tblBottom);
    });
    // Draw horizontal separator line between Result row and Table header
    setDC(isBW ? [180, 180, 180] : [200, 208, 235]);
    doc.setLineWidth(0.25);
    doc.line(margin, tableTop, rightX, tableTop);

    y = tblBottom;
  }

  // ── Force new page — page 1 ends after summary / non-compliant table ──
  doc.addPage();
  y = 20;


  // ── SECTIONS (Detailed Report) ────────────────────────────────────────────
  const LINE_H_NORMAL = 5.0;   // line height for body text (10 pt)
  const LINE_H_SMALL = 4.5;   // line height for label text (10 pt)

  const sections = [...new Set(data.questions.map(q => q.question_section).filter(Boolean))];

  let globalQIdx = 0;

  sections.forEach((section, sIdx) => {
    const sectionQs = data.questions.filter(q => q.question_section === section);
    const secResps = data.responses.filter(r => sectionQs.some(q => q.id === r.question));
    const secYes = secResps.filter(r => r.answer === 'yes').length;

    // ── Section header ────────────────────────────────────────────────────
    checkPageBreak(18);
    const secHeaderBg: [number, number, number] = isBW ? [232, 232, 232] : [228, 234, 255];
    fillRect(13, secHeaderBg);
    setDC(isBW ? black : [90, 115, 200]);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin, y + 13);

    y += 8.5;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(primary);
    doc.text(section.toUpperCase(), margin + 6, y);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setTC(secondary);
    doc.text(`${secYes} / ${sectionQs.length} compliant`, rightX, y, { align: 'right' });
    y += 6.5;

    // ── Questions ─────────────────────────────────────────────────────────
    sectionQs.forEach((q, _idx) => {
      globalQIdx++;
      const resp = data.responses.find(r => r.question === q.id);
      if (!resp) return;

      const isYes = resp.answer === 'yes';
      const pillFill: [number, number, number] = isBW ? black : (isYes ? [0, 128, 80] : [180, 40, 40]);

      checkPageBreak(30);

      // ── Q number + question text ──────────────────────────────────────
      const qNumW = 10;                     // width reserved for "Q1."
      const qTextX = margin + qNumW;
      const qTextW = fullW - qNumW;          // text spans to right margin

      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      setTC(isBW ? black : [70, 80, 110]);
      doc.text(`Q${globalQIdx}.`, margin, y + 3.5);

      // Render question text with **bold** support
      y = drawRichText(
        q.question, qTextX, y + 3.5, qTextW, 10, 'normal',
        isBW ? black : [20, 25, 50], LINE_H_NORMAL
      ) + 1.5;

      // ── Explanation ───────────────────────────────────────────────────
      if (q.explanation) {
        checkPageBreak(16);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        setTC(isBW ? black : [90, 95, 120]);
        doc.text('Explanation:', margin, y);
        y += LINE_H_SMALL + 1;

        // Render explanation with **bold** support
        y = drawRichText(
          q.explanation, margin, y, fullW, 10, 'italic',
          isBW ? [40, 40, 40] : [100, 105, 130], LINE_H_SMALL
        ) + 1.5;
      }

      // ── Answer pill ───────────────────────────────────────────────────
      checkPageBreak(14);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      setTC(isBW ? black : [90, 95, 120]);
      doc.text('Your Response:', margin, y);

      const pillLabel = isYes ? 'YES' : 'NO';
      const pillW = 16;
      const pillH = 6;
      const pillX = margin + 38;               // right of the label
      doc.setFillColor(...pillFill);
      if (isBW) {
        setDC(black); doc.setLineWidth(0.4);
        doc.roundedRect(pillX, y - 4.5, pillW, pillH, 1.5, 1.5, 'D');
        setTC(black);
      } else {
        doc.roundedRect(pillX, y - 4.5, pillW, pillH, 1.5, 1.5, 'F');
        setTC(white);
      }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(pillLabel, pillX + pillW / 2, y - 0.5, { align: 'center' });
      y += 8;

      // ── Feedback ──────────────────────────────────────────────────────
      const feedText = isYes ? q.feedback_for_yes : q.feedback_for_no;
      if (feedText) {
        checkPageBreak(16);
        const fbLabel = isYes ? 'Feedback (Compliant):' : 'Feedback (Non-Compliant):';

        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        setTC(isBW ? black : pillFill);
        doc.text(fbLabel, margin, y);
        y += LINE_H_SMALL + 1;

        // Render feedback with **bold** support
        y = drawRichText(
          feedText, margin, y, fullW, 10, 'normal',
          isBW ? [20, 20, 20] : [50, 55, 70], LINE_H_NORMAL
        ) + 1.5;
      }

      // ── Guidance ──────────────────────────────────────────────────────
      if (q.guidance) {
        checkPageBreak(16);
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        setTC(accent);
        doc.text('Guidance:', margin, y);
        y += LINE_H_SMALL + 0.5;

        // Render guidance content — only **marked** text from DB is bold
        y = drawRichText(
          q.guidance, margin, y, fullW, 10, 'normal',
          isBW ? [35, 35, 35] : [40, 70, 130], LINE_H_NORMAL
        ) + 0.5;
      }

      y += 2.5;   // compact breathing room between questions
    });

    // Moderate gap between sections (but not after the last one)
    if (sIdx < sections.length - 1) y += 3;
  });


  // ── REPORT METADATA (Timestamp & IP) ──────────────────────────────────────
  checkPageBreak(20);
  y += 4;
  drawLine(dividerGray, 0.3);
  y += 2;

  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  setTC(isBW ? [100, 100, 100] : [130, 140, 170]);
  doc.text(`Report Generated: ${reportGeneratedAt}`, margin, y);
  y += 4;
  doc.text(`Device IP Address: ${deviceIP}`, margin, y);
  y += 4;


  // ── FOOTER ────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (!isBW) {
      doc.setFillColor(244, 246, 252);
      doc.rect(0, 284, pageW, 13, 'F');
      setDC([210, 215, 235]); doc.setLineWidth(0.25);
      doc.line(0, 284, pageW, 284);
    } else {
      setDC(black); doc.setLineWidth(0.2);
      doc.line(margin, 284, rightX, 284);
    }
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    setTC(isBW ? [80, 80, 80] : [120, 130, 160]);
    doc.text(
      'EEE Application Readiness Check Portal \u2014 Confidential Assessment Report',
      margin, 290
    );
    doc.text(`Page ${i} of ${totalPages}`, rightX, 290, { align: 'right' });
  }

  doc.save(
    `EEE_Report_${data.applicantName.replace(/\s+/g, '_')}_${isBW ? 'BW_' : ''}${Date.now()}.pdf`
  );
}


/*
import jsPDF from 'jspdf';
import type { Question, Response as UserResponse } from '../types';

interface ReportData {
  applicantName: string;
  applicantEmail: string;
  labType: string;
  scope: string;
  questions: Question[];
  responses: UserResponse[];
  submittedAt?: string;
  printerFriendly?: boolean;
}

export function generatePDFReport(data: ReportData) {
  const isBW = !!data.printerFriendly;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Layout constants ──────────────────────────────────────────────────────
  const pageW = 210;
  const margin = 15;                        // left & right margin
  const fullW = pageW - margin * 2;        // 180 mm — full usable width
  const rightX = margin + fullW;            // 195 mm — hard right edge
  let y = 0;

  // ── Colour palette ────────────────────────────────────────────────────────
  const black: [number, number, number] = [0, 0, 0];
  const white: [number, number, number] = [255, 255, 255];
  const primary: [number, number, number] = isBW ? black : [13, 27, 62];
  const secondary: [number, number, number] = isBW ? [60, 60, 60] : [80, 100, 180];
  const accent: [number, number, number] = isBW ? [40, 40, 40] : [30, 90, 165];
  const bgLight: [number, number, number] = isBW ? [248, 248, 248] : [242, 245, 252];
  const borderLight: [number, number, number] = isBW ? [200, 200, 200] : [220, 222, 235];
  const dividerGray: [number, number, number] = isBW ? [190, 190, 190] : [210, 215, 235];

  // ── Helpers ───────────────────────────────────────────────────────────────

  const checkPageBreak = (needed: number) => {
    if (y + needed > 272) { doc.addPage(); y = 20; }
  };

  const drawLine = (color: [number, number, number] = borderLight, lw = 0.25) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(margin, y, rightX, y);
    y += 4;
  };

  const fillRect = (h: number, color: [number, number, number], x = margin, w = fullW) => {
    doc.setFillColor(...color);
    doc.rect(x, y, w, h, 'F');
  };

  const setTC = (c: [number, number, number]) => doc.setTextColor(...c);
  const setDC = (c: [number, number, number]) => doc.setDrawColor(...c);


  // ── PAGE HEADER ───────────────────────────────────────────────────────────
  if (isBW) {
    setDC(black);
    doc.setLineWidth(0.6);
    doc.rect(margin, 10, fullW, 26);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setTC(black);
    doc.text('EEE Application Readiness Check', margin + 5, 22);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setTC([60, 60, 60]);
    doc.text('Section 79A \u2014 IT Act 2000  |  Assessment Report', margin + 5, 30);
    y = 48;
  } else {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageW, 44, 'F');
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setTC(white);
    doc.text('EEE Application Readiness Check', margin, 17);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setTC([180, 200, 240]);
    doc.text('Section 79A \u2014 IT Act 2000  |  Assessment Report', margin, 26);
    doc.setFontSize(10); setTC([130, 160, 210]);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, 34);
    y = 54;
  }


  // ── APPLICANT DETAILS ─────────────────────────────────────────────────────
  // Column geometry — defined early so we can pre-compute wrapped line counts
  const labelW = 22;
  const col1Val = margin + 4 + labelW;           // value starts after label
  const col2 = margin + (fullW / 2) + 2;       // second column start
  const col2Val = col2 + labelW;                  // second value start

  // Available widths for value text in each column
  const valW1 = col2 - col1Val - 3;               // ~63 mm
  const valW2 = rightX - col2Val - 3;             // ~61 mm

  // Pre-compute wrapped lines at font size 10 so we know exact box height
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const nameLines = doc.splitTextToSize(data.applicantName || '\u2014', valW1);
  const emailLines = doc.splitTextToSize(data.applicantEmail || '\u2014', valW2);
  const labLines = doc.splitTextToSize(data.labType || '\u2014', valW1);
  const scopeLines = doc.splitTextToSize(data.scope || '\u2014', valW2);

  const DETAIL_LINE_H = 5.0;   // line height inside the details box
  const DETAIL_PAD = 5;     // vertical padding above each data row
  const DETAIL_HDR_H = 12;    // height of "APPLICANT DETAILS" label row

  // Row heights driven by whichever column has more wrapped lines
  const row1H = Math.max(nameLines.length, emailLines.length) * DETAIL_LINE_H + DETAIL_PAD;
  const row2H = Math.max(labLines.length, scopeLines.length) * DETAIL_LINE_H + DETAIL_PAD;
  const detailBoxH = DETAIL_HDR_H + row1H + row2H + 4;   // +4 bottom padding

  fillRect(detailBoxH, bgLight);
  setDC(isBW ? [160, 160, 160] : [180, 190, 220]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, fullW, detailBoxH);

  // "APPLICANT DETAILS" header label
  y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(secondary);
  doc.text('APPLICANT DETAILS', margin + 4, y);
  y += DETAIL_HDR_H - 8 + DETAIL_PAD;   // advance to first data row baseline

  // Row 1: Name / Email
  const r1BaseY = y;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Name:', margin + 4, r1BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(nameLines, col1Val, r1BaseY);
  doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Email:', col2, r1BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(emailLines, col2Val, r1BaseY);
  y = r1BaseY + row1H;

  // Row 2: Lab Type / Scope
  const r2BaseY = y;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Lab Type:', margin + 4, r2BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(labLines, col1Val, r2BaseY);
  doc.setFont('helvetica', 'bold'); setTC(isBW ? black : [60, 70, 100]);
  doc.text('Scope:', col2, r2BaseY);
  doc.setFont('helvetica', 'normal'); setTC(isBW ? black : [30, 30, 50]);
  doc.text(scopeLines, col2Val, r2BaseY);
  y = r2BaseY + row2H + 4 + 8;   // bottom padding + gap before next section


  // ── ASSESSMENT SUMMARY ────────────────────────────────────────────────────
  const answered = data.responses.length;
  const yesCount = data.responses.filter(r => r.answer === 'yes').length;
  const noCount = answered - yesCount;
  const pct = answered ? Math.round((yesCount / answered) * 100) : 0;
  const isEligible = pct === 100;

  const eligibleColor: [number, number, number] = isBW ? black : [0, 120, 80];
  const notEligColor: [number, number, number] = isBW ? black : [180, 30, 30];
  const resultColor = isEligible ? eligibleColor : notEligColor;
  const resultBg: [number, number, number] = isBW ? [240, 240, 240] : (isEligible ? [235, 255, 245] : [255, 240, 240]);
  const resultBorder: [number, number, number] = isBW ? [150, 150, 150] : (isEligible ? [0, 160, 100] : [200, 50, 50]);

  // ── Heights for each row so we can draw the outer border first ──────────
  const ROW1_H = 18;   // stats row
  const ROW2_H = isEligible ? 14 : 20;   // result row (taller when note shown)
  const HDR_H = 11;   // "ASSESSMENT SUMMARY" header bar
  const BOX_H = HDR_H + ROW1_H + ROW2_H;

  checkPageBreak(BOX_H + 6);

  const boxTop = y;

  // ── Outer border around the entire summary box ────────────────────────
  setDC(isBW ? black : [160, 170, 210]);
  doc.setLineWidth(0.4);
  doc.rect(margin, boxTop, fullW, BOX_H);

  // ── Header bar ───────────────────────────────────────────────────────
  const summaryBg: [number, number, number] = isBW ? [220, 220, 220] : primary;
  const summaryFg: [number, number, number] = isBW ? black : white;
  fillRect(HDR_H, summaryBg);
  y += 7.5;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(summaryFg);
  doc.text('ASSESSMENT SUMMARY', margin + 4, y);
  y += HDR_H - 7.5;   // advance to end of header

  // ── Row 1: Stats ──────────────────────────────────────────────────────
  const row1Top = y;
  fillRect(ROW1_H, bgLight);

  // internal horizontal divider at bottom of row 1
  setDC(isBW ? [180, 180, 180] : [200, 208, 235]);
  doc.setLineWidth(0.25);
  doc.line(margin, row1Top + ROW1_H, margin + fullW, row1Top + ROW1_H);

  const statsGap = fullW / 4;
  const stats: [string, string][] = [
    ['Total Answered', `${answered}`],
    ['Compliant (Yes)', `${yesCount}`],
    ['Non-Compliant (No)', `${noCount}`],
    ['Overall Score', `${pct}%`],
  ];

  // vertical column separators inside row 1
  setDC(isBW ? [200, 200, 200] : [210, 218, 240]);
  doc.setLineWidth(0.2);
  for (let c = 1; c < 4; c++) {
    const cx = margin + c * statsGap;
    doc.line(cx, row1Top, cx, row1Top + ROW1_H);
  }

  stats.forEach(([label, value], i) => {
    const sx = margin + i * statsGap + statsGap / 2;
    const vy = row1Top + 7;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    setTC(isBW ? black : secondary);
    doc.text(value, sx, vy, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    setTC(isBW ? [70, 70, 70] : [100, 110, 140]);
    doc.text(label, sx, vy + 5, { align: 'center' });
  });

  y = row1Top + ROW1_H;

  // ── Row 2: Result ─────────────────────────────────────────────────────
  const row2Top = y;
  fillRect(ROW2_H, resultBg);

  // bold left accent bar on result row
  setDC(resultBorder);
  doc.setLineWidth(1.2);
  doc.line(margin, row2Top, margin, row2Top + ROW2_H);
  doc.setLineWidth(0.4);   // reset

  // "RESULT" sub-label
  y = row2Top + 5;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  setTC(isBW ? [90, 90, 90] : [110, 120, 155]);
  doc.text('RESULT', margin + 5, y);
  y += 5;

  // Verdict text
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(resultColor);
  const resultText = isEligible
    ? 'Eligible for EEE Application'
    : 'Not Eligible for EEE Application';
  doc.text(resultText, margin + 5, y);

  if (!isEligible) {
    const shortfall = answered - yesCount;
    y += 6;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    setTC(isBW ? [80, 80, 80] : [160, 55, 55]);
    doc.text(
      `${shortfall} non-compliant item${shortfall !== 1 ? 's' : ''} must be resolved before applying.`,
      margin + 5, y
    );
  }

  y = row2Top + ROW2_H + 8;   // clear the box with breathing room


  // ── SECTIONS ──────────────────────────────────────────────────────────────
  const LINE_H_NORMAL = 5.0;   // line height for body text (10 pt)
  const LINE_H_SMALL = 4.5;   // line height for label text (10 pt)

  const sections = [...new Set(data.questions.map(q => q.question_section).filter(Boolean))];

  sections.forEach((section, sIdx) => {
    const sectionQs = data.questions.filter(q => q.question_section === section);
    const secResps = data.responses.filter(r => sectionQs.some(q => q.id === r.question));
    const secYes = secResps.filter(r => r.answer === 'yes').length;

    // ── Section header ────────────────────────────────────────────────────
    checkPageBreak(18);
    const secHeaderBg: [number, number, number] = isBW ? [232, 232, 232] : [228, 234, 255];
    fillRect(13, secHeaderBg);
    setDC(isBW ? black : [90, 115, 200]);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin, y + 13);

    y += 9;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTC(primary);
    doc.text(section.toUpperCase(), margin + 6, y);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setTC(secondary);
    doc.text(`${secYes} / ${sectionQs.length} compliant`, rightX, y, { align: 'right' });
    y += 10;

    // ── Questions ─────────────────────────────────────────────────────────
    sectionQs.forEach((q, idx) => {
      const resp = data.responses.find(r => r.question === q.id);
      if (!resp) return;

      const isYes = resp.answer === 'yes';
      const pillFill: [number, number, number] = isBW ? black : (isYes ? [0, 128, 80] : [180, 40, 40]);

      checkPageBreak(30);

      // ── Q number + question text ──────────────────────────────────────
      const qNumW = 10;                     // width reserved for "Q1."
      const qTextX = margin + qNumW;
      const qTextW = fullW - qNumW;          // text spans to right margin

      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      setTC(isBW ? black : [70, 80, 110]);
      doc.text(`Q${idx + 1}.`, margin, y + 3.5);

      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      setTC(isBW ? black : [20, 25, 50]);
      const qLines = doc.splitTextToSize(q.question, qTextW);
      doc.text(qLines, qTextX, y + 3.5);
      y += qLines.length * LINE_H_NORMAL + 5;

      // ── Explanation ───────────────────────────────────────────────────
      if (q.explanation) {
        checkPageBreak(16);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        setTC(isBW ? black : [90, 95, 120]);
        doc.text('Explanation:', margin, y);
        y += LINE_H_SMALL + 1;

        doc.setFontSize(10); doc.setFont('helvetica', 'italic');
        setTC(isBW ? [40, 40, 40] : [100, 105, 130]);
        const expLines = doc.splitTextToSize(q.explanation, fullW);
        checkPageBreak(expLines.length * LINE_H_SMALL + 4);
        doc.text(expLines, margin, y);
        y += expLines.length * LINE_H_SMALL + 5;
      }

      // ── Answer pill ───────────────────────────────────────────────────
      checkPageBreak(14);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      setTC(isBW ? black : [90, 95, 120]);
      doc.text('Your Response:', margin, y);

      const pillLabel = isYes ? 'YES' : 'NO';
      const pillW = 16;
      const pillH = 6;
      const pillX = margin + 38;               // right of the label
      doc.setFillColor(...pillFill);
      if (isBW) {
        setDC(black); doc.setLineWidth(0.4);
        doc.roundedRect(pillX, y - 4.5, pillW, pillH, 1.5, 1.5, 'D');
        setTC(black);
      } else {
        doc.roundedRect(pillX, y - 4.5, pillW, pillH, 1.5, 1.5, 'F');
        setTC(white);
      }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(pillLabel, pillX + pillW / 2, y - 0.5, { align: 'center' });
      y += 8;

      // ── Feedback ──────────────────────────────────────────────────────
      const feedText = isYes ? q.feedback_for_yes : q.feedback_for_no;
      if (feedText) {
        checkPageBreak(16);
        const fbLabel = isYes ? 'Feedback (Compliant):' : 'Feedback (Non-Compliant):';

        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        setTC(isBW ? black : pillFill);
        doc.text(fbLabel, margin, y);
        y += LINE_H_SMALL + 1;

        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        setTC(isBW ? [20, 20, 20] : [50, 55, 70]);
        const fbLines = doc.splitTextToSize(feedText, fullW);
        checkPageBreak(fbLines.length * LINE_H_NORMAL + 4);
        doc.text(fbLines, margin, y);
        y += fbLines.length * LINE_H_NORMAL + 5;
      }

      // ── Guidance ──────────────────────────────────────────────────────
      if (q.guidance) {
        checkPageBreak(16);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        setTC(accent);
        doc.text('Guidance:', margin, y);
        y += LINE_H_SMALL + 1;

        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        setTC(isBW ? [35, 35, 35] : [40, 70, 130]);
        const guidLines = doc.splitTextToSize(q.guidance, fullW);
        checkPageBreak(guidLines.length * LINE_H_NORMAL + 4);
        doc.text(guidLines, margin, y);
        y += guidLines.length * LINE_H_NORMAL + 5;
      }

      y += 6;   // breathing room between questions
    });

    // Extra breathing room between sections (but not after the last one)
    if (sIdx < sections.length - 1) y += 6;
  });


  // ── FOOTER ────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (!isBW) {
      doc.setFillColor(244, 246, 252);
      doc.rect(0, 284, pageW, 13, 'F');
      setDC([210, 215, 235]); doc.setLineWidth(0.25);
      doc.line(0, 284, pageW, 284);
    } else {
      setDC(black); doc.setLineWidth(0.2);
      doc.line(margin, 284, rightX, 284);
    }
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    setTC(isBW ? [80, 80, 80] : [120, 130, 160]);
    doc.text(
      'EEE Application Readiness Check Portal \u2014 Confidential Assessment Report',
      margin, 290
    );
    doc.text(`Page ${i} of ${totalPages}`, rightX, 290, { align: 'right' });
  }

  doc.save(
    `EEE_Report_${data.applicantName.replace(/\s+/g, '_')}_${isBW ? 'BW_' : ''}${Date.now()}.pdf`
  );
}

  */
