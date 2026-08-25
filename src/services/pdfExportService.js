/**
 * PDF Export Service — Geração de relatório de simulado em PDF
 * Usa jsPDF para geração client-side
 */
import jsPDF from 'jspdf';

export const generateExamReport = (examData, questions = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPage = (needed = 10) => {
    if (y + needed > 277) addPage();
  };

  // ── CAPA ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFillColor(99, 102, 241);
  doc.roundedRect(margin, 40, contentW, 60, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('PNA MedPremium', margin + 10, 65);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Simulado', margin + 10, 76);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, margin + 10, 84);

  // Estatísticas da capa
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, 115, contentW, 80, 6, 6, 'F');

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text('RESULTADO DA SESSÃO', margin + 10, 132);

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text(`${examData.accuracyPct || 0}%`, margin + 10, 155);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Acurácia Global`, margin + 10, 165);

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text(`Total de Questões: ${examData.totalQuestions || 0}`, margin + 10, 178);
  doc.text(`Acertos: ${examData.correct || 0}`, margin + 10, 186);
  doc.text(`Erros: ${examData.incorrect || 0}`, margin + contentW / 2, 178);
  doc.text(`Tempo Médio: ${examData.avgTimeSec || 0}s/questão`, margin + contentW / 2, 186);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Gerado por PNA MedPremium • Plataforma de Residência Médica', margin, 280);

  // ── QUESTÕES ──
  if (questions && questions.length > 0) {
    addPage();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Questões do Simulado', margin, 13);
    y = 28;

    questions.forEach((q, idx) => {
      checkPage(35);

      // Question number badge
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(margin, y, 7, 7, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${idx + 1}`, margin + 1.5, y + 5);

      // Area tag
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${q.area || ''} • ${q.ano_da_prova || ''}`, margin + 10, y + 5);

      y += 10;

      // Question text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      const qText = (q.enunciado || '').substring(0, 400);
      const lines = doc.splitTextToSize(qText, contentW);
      const displayLines = lines.slice(0, 6);

      doc.setTextColor(15, 23, 42);
      displayLines.forEach(line => {
        checkPage(5);
        doc.text(line, margin, y);
        y += 4.5;
      });
      if (lines.length > 6) { doc.text('...', margin, y); y += 4.5; }

      // Options
      const opts = ['A', 'B', 'C', 'D', 'E'];
      opts.forEach(opt => {
        const optText = q[`opcao_${opt.toLowerCase()}`] || q[`opção_${opt}`];
        if (!optText) return;
        checkPage(6);

        const isCorrect = q.opcao_correta === opt || q.opção_correta === opt;
        if (isCorrect) {
          doc.setFillColor(220, 252, 231);
          doc.roundedRect(margin, y - 3.5, contentW, 6, 1, 1, 'F');
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', isCorrect ? 'bold' : 'normal');
        doc.setTextColor(isCorrect ? 22 : 71, isCorrect ? 101 : 85, isCorrect ? 52 : 105);
        const optLine = doc.splitTextToSize(`${opt}) ${optText}`, contentW - 4);
        doc.text(optLine[0], margin + 2, y);
        y += 5.5;
      });

      y += 4;
      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, margin + contentW, y);
      y += 5;
    });
  }

  // ── GABARITO ──
  addPage();
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Gabarito Oficial', margin, 13);
  y = 28;

  const cols = 4;
  const colW = contentW / cols;

  questions.forEach((q, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const xPos = margin + col * colW;
    const yPos = y + row * 10;

    if (yPos + 10 > 277) {
      // Would overflow — truncate
      return;
    }

    const answer = q.opcao_correta || q.opção_correta || '?';
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${(idx + 1).toString().padStart(3, '0')}. `, xPos, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(answer, xPos + 10, yPos);
  });

  const filename = `simulado_pna_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  return filename;
};
