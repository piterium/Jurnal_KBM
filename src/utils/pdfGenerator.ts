import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppData, ClassRoom } from '../types';
import {
  MONTH_NAMES_ID,
  calculateStudentAttendanceSummary,
  calculateStudentFinalGrade,
  getJournalAttendanceInfo,
  formatShortDateIndonesian,
  sortStudentsByAttendanceNo,
} from './storage';

export interface GeneratePdfOptions {
  month: number; // 1 - 12
  year: number; // e.g. 2026
  classId?: string; // specific class or all
  reportType: 'FULL' | 'JOURNAL' | 'ATTENDANCE' | 'GRADES';
  attendanceMatrixMode?: 'CALENDAR' | 'SESSIONS';
  signatureCity?: string;
  signatureDate?: string;
}

export function generateMonthlyReportPdf(data: AppData, options: GeneratePdfOptions): jsPDF {
  const { profile, classes, students, journals, attendances, assessments } = data;
  const { month, year, classId, reportType } = options;

  const monthName = MONTH_NAMES_ID[month - 1];
  const targetClass = classId && classId !== 'ALL' ? classes.find(c => c.id === classId) : null;
  const filteredClasses = targetClass ? [targetClass] : classes;

  const city = options.signatureCity || profile.districtCity || 'Kota';
  const signDate = options.signatureDate || formatShortDateIndonesian(`${year}-${String(month).padStart(2, '0')}-28`);

  // Orientation: Landscape for wide tables like Attendance Matrix or Gradebook, Portrait for Journal/Full summary
  const orientation = reportType === 'ATTENDANCE' || reportType === 'GRADES' ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper to draw formal Indonesian KOP Surat
  const drawKopSurat = (currentDoc: jsPDF) => {
    const topY = 10;
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    const availableWidth = rightMargin - leftMargin;

    // 1. If user uploaded a complete Kop Surat image, draw it directly
    if (
      profile.kopSuratUrl &&
      (profile.kopSuratUrl.startsWith('data:image') ||
        profile.kopSuratUrl.startsWith('http') ||
        profile.kopSuratUrl.startsWith('blob:'))
    ) {
      try {
        // @ts-ignore
        const imgProps = currentDoc.getImageProperties(profile.kopSuratUrl);
        let kopW = availableWidth;
        let kopH = 30; // sensible default height for letterhead banner
        if (imgProps && imgProps.width && imgProps.height) {
          const aspect = imgProps.width / imgProps.height;
          kopH = Math.min(Math.max(availableWidth / aspect, 18), 38);
        }
        currentDoc.addImage(profile.kopSuratUrl, leftMargin, topY, kopW, kopH);
        return topY + kopH + 5;
      } catch (e) {
        console.warn('Could not add uploaded kop surat image, falling back to standard layout:', e);
      }
    }

    // 2. Fallback text Kop Surat without Dinas/Kantor text (per user request)
    const schoolNameHeight = 6.0;
    const addressHeight = 4.2;
    const totalTextHeight = schoolNameHeight + addressHeight;

    // Define Logo bounding limits
    const maxLogoBox = 20; // 20mm x 20mm bounding box
    let logoW = maxLogoBox;
    let logoH = maxLogoBox;
    let hasLogo = false;

    if (profile.logoUrl && (profile.logoUrl.startsWith('data:image') || profile.logoUrl.startsWith('http') || profile.logoUrl.startsWith('blob:'))) {
      hasLogo = true;
      try {
        // @ts-ignore
        const imgProps = currentDoc.getImageProperties(profile.logoUrl);
        if (imgProps && imgProps.width && imgProps.height) {
          const aspect = imgProps.width / imgProps.height;
          if (aspect >= 1) {
            logoW = maxLogoBox;
            logoH = maxLogoBox / aspect;
          } else {
            logoH = maxLogoBox;
            logoW = maxLogoBox * aspect;
          }
        }
      } catch {
        logoW = maxLogoBox;
        logoH = maxLogoBox;
      }
    }

    // Determine total Kop content height ensuring both text and logo have clear vertical breathing room
    const effectiveContentH = hasLogo ? Math.max(totalTextHeight, logoH) : totalTextHeight;
    const kopHeight = Math.max(effectiveContentH + 4, 22);
    const doubleLineY = topY + kopHeight;

    // Calculate vertical start positions to perfectly center both logo and text
    const textStartY = topY + (kopHeight - totalTextHeight) / 2 + 3.5;
    const logoY = topY + (kopHeight - logoH) / 2;
    const logoX = leftMargin + (maxLogoBox - logoW) / 2;

    // A. Draw School Logo on the left
    if (hasLogo && profile.logoUrl) {
      try {
        currentDoc.addImage(profile.logoUrl, logoX, logoY, logoW, logoH);
      } catch (e) {
        console.warn('Could not add logo image to PDF:', e);
      }
    }

    // B. Draw School Name and Address (Kantor / Dinas header removed)
    let curY = textStartY;
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.setFontSize(14);
    currentDoc.setTextColor(15, 23, 42);
    currentDoc.text((profile.schoolName || 'SEKOLAH / MADRASAH').toUpperCase(), pageWidth / 2, curY, { align: 'center' });
    curY += schoolNameHeight;

    currentDoc.setFont('helvetica', 'normal');
    currentDoc.setFontSize(8.5);
    currentDoc.setTextColor(71, 85, 105);
    const addressParts = [
      profile.schoolAddress,
      profile.npsn ? `NPSN: ${profile.npsn}` : '',
      profile.districtCity && profile.province ? `${profile.districtCity}, ${profile.province}` : (profile.districtCity || profile.province || ''),
    ].filter(Boolean);
    const addressStr = addressParts.join(' | ');
    if (addressStr) {
      currentDoc.text(addressStr, pageWidth / 2, curY, { align: 'center' });
    }

    // C. Draw Formal Indonesian Double Lines (Solid primary line + thin secondary line)
    currentDoc.setDrawColor(15, 23, 42);
    currentDoc.setLineWidth(0.85);
    currentDoc.line(leftMargin, doubleLineY, rightMargin, doubleLineY);
    currentDoc.setLineWidth(0.35);
    currentDoc.line(leftMargin, doubleLineY + 1.2, rightMargin, doubleLineY + 1.2);

    return doubleLineY + 6;
  };

  // Helper to draw signatures
  const drawSignatures = (currentDoc: jsPDF, finalY: number) => {
    let signY = finalY + 8;
    if (signY + 38 > pageHeight) {
      currentDoc.addPage();
      signY = 20;
    }

    currentDoc.setFont('helvetica', 'normal');
    currentDoc.setFontSize(9.5);
    currentDoc.setTextColor(15, 23, 42);

    const leftX = orientation === 'landscape' ? 45 : 35;
    const rightX = orientation === 'landscape' ? pageWidth - 70 : pageWidth - 60;

    // Date and location above teacher signature
    currentDoc.text(`${city}, ${signDate}`, rightX, signY, { align: 'center' });
    signY += 5;

    currentDoc.text('Mengetahui,', leftX, signY, { align: 'center' });
    currentDoc.text('Guru Mata Pelajaran,', rightX, signY, { align: 'center' });

    signY += 4;
    currentDoc.text('Kepala Sekolah', leftX, signY, { align: 'center' });
    currentDoc.text(profile.subject, rightX, signY, { align: 'center' });

    signY += 20; // Space for physical signature / stempel

    // Principal info
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.text(profile.headmasterName, leftX, signY, { align: 'center' });
    currentDoc.setFont('helvetica', 'normal');
    currentDoc.setFontSize(8.5);
    currentDoc.text(`NIP. ${profile.headmasterNip || '-'}`, leftX, signY + 4, { align: 'center' });

    // Teacher info
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.setFontSize(9.5);
    currentDoc.text(profile.teacherName, rightX, signY, { align: 'center' });
    currentDoc.setFont('helvetica', 'normal');
    currentDoc.setFontSize(8.5);
    currentDoc.text(`NIP. ${profile.teacherNip || '-'}`, rightX, signY + 4, { align: 'center' });
  };

  // 1. SECTION HEADER
  let currentY = drawKopSurat(doc);

  // Title of Document
  let reportTitle = '';
  if (reportType === 'FULL') {
    reportTitle = 'LAPORAN BULANAN KEGIATAN BELAJAR MENGAJAR & KINERJA GURU';
  } else if (reportType === 'JOURNAL') {
    reportTitle = 'BUKU REKAPITULASI JURNAL MENGAJAR & AGENDA GURU';
  } else if (reportType === 'ATTENDANCE') {
    reportTitle = 'REKAPITULASI PRESENSI / KEHADIRAN SISWA BULANAN';
  } else if (reportType === 'GRADES') {
    reportTitle = 'LEGER DAFTAR NILAI DAN KETUNTASAN ASESMEN SISWA';
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(reportTitle, pageWidth / 2, currentY + 3, { align: 'center' });
  currentY += 7;

  // Metadata Subhead
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const classLabel = targetClass ? targetClass.name : 'Semua Kelas Binaan';
  doc.text(`Bulan: ${monthName} ${year}   |   Mata Pelajaran: ${profile.subject}   |   Kelas: ${classLabel}   |   T.A: ${profile.academicYear} (Semester ${profile.semester})`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  // Render specific content depending on reportType
  if (reportType === 'FULL' || reportType === 'JOURNAL') {
    // --- 1. JURNAL MENGAJAR TABLE ---
    const monthlyJournals = journals.filter(j => {
      const d = new Date(j.date);
      const matchesMonth = (d.getMonth() + 1) === month && d.getFullYear() === year;
      const matchesClass = targetClass ? j.classId === targetClass.id : true;
      return matchesMonth && matchesClass;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('I. CATATAN JURNAL DAN PELAKSANAAN PEMBELAJARAN', 14, currentY + 4);
    currentY += 6;

    const journalTableRows = monthlyJournals.length > 0 ? monthlyJournals.map((j, idx) => {
      const clsName = classes.find(c => c.id === j.classId)?.name || j.classId;
      const attInfo = getJournalAttendanceInfo(j, attendances, students);
      const attendanceStr = attInfo.hasRecord
        ? (attInfo.isNihil ? 'Nihil' : attInfo.pdfSummaryText)
        : '-';

      return [
        (idx + 1).toString(),
        formatShortDateIndonesian(j.date),
        clsName,
        `Ke-${j.meetingNumber}`,
        `Jam ${j.jamKe || '1, 2'}\n(${j.hoursCount || 2} JP)`,
        j.topic,
        attendanceStr,
        j.status || 'Terlaksana',
        j.keterangan || j.notes || '-',
      ];
    }) : [[
      '-', '-', '-', '-', '-', 'Tidak ada data jurnal mengajar pada periode bulan ini.', '-', '-', '-'
    ]];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Kelas', 'Pert.', 'Jam Ke- (JP)', 'Materi Pokok / Bahasan Pembelajaran', 'Presensi', 'Status', 'Ket.']],
      body: journalTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Deep navy
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 11 },
        4: { halign: 'center', cellWidth: 19 },
        5: { cellWidth: 46 },
        6: { halign: 'center', cellWidth: 26 },
        7: { halign: 'center', cellWidth: 16 },
        8: { cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 6;
  }

  if (reportType === 'FULL' || reportType === 'ATTENDANCE') {
    // --- 2. ATTENDANCE SUMMARY TABLE ---
    filteredClasses.forEach(cls => {
      const clsStudents = sortStudentsByAttendanceNo(
        students.filter(s => s.classId === cls.id && s.active)
      );
      const clsAttendances = attendances.filter(a => {
        const d = new Date(a.date);
        return a.classId === cls.id && (d.getMonth() + 1) === month && d.getFullYear() === year;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (currentY + 30 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      const useCalendarMode = options.attendanceMatrixMode
        ? options.attendanceMatrixMode === 'CALENDAR'
        : (options.reportType === 'ATTENDANCE' && orientation === 'landscape');
      const daysInMonth = new Date(year, month, 0).getDate();

      const modeTitle = useCalendarMode ? 'FORMAT KALENDER BULANAN' : 'SESI PERTEMUAN TERLAKSANA';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const sectionNum = reportType === 'FULL' ? 'II.' : 'I.';
      doc.text(`${sectionNum} REKAPITULASI PRESENSI SISWA (${modeTitle}) BULAN ${monthName.toUpperCase()} ${year} - ${cls.name.toUpperCase()}`, 14, currentY + 3);
      currentY += 5;

      let dateCols: { dateStr: string; label: string; isSunday: boolean }[] = [];

      if (useCalendarMode) {
        // Generate 1 to daysInMonth columns
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dObj = new Date(year, month - 1, day);
          const isSunday = dObj.getDay() === 0;
          dateCols.push({
            dateStr,
            label: `${day}`,
            isSunday,
          });
        }
      } else {
        // Use recorded session dates
        dateCols = clsAttendances.map((a, idx) => {
          const p = a.date.split('-');
          return {
            dateStr: a.date,
            label: `${p[2]}/${p[1]}`,
            isSunday: false,
          };
        });
      }

      const tableHead = [
        'No',
        'NISN',
        'Nama Lengkap Siswa',
        'L/P',
        ...dateCols.map(c => c.label),
        'H',
        'S',
        'I',
        'A',
        '%',
      ];

      // Map each student
      const tableBody = clsStudents.map((std, idx) => {
        const summary = calculateStudentAttendanceSummary(std.id, clsAttendances);
        const dateStatuses = dateCols.map(col => {
          if (col.isSunday) return 'L';
          const att = clsAttendances.find(a => a.date === col.dateStr);
          if (!att) return '-';
          return att.records[std.id]?.status || '-';
        });

        return [
          (std.attendanceNo !== undefined && std.attendanceNo !== null && std.attendanceNo !== '' ? std.attendanceNo : (idx + 1)).toString(),
          std.nisn,
          std.name,
          std.gender,
          ...dateStatuses,
          summary.H.toString(),
          summary.S.toString(),
          summary.I.toString(),
          summary.A.toString(),
          `${summary.percent}%`,
        ];
      });

      // Add summary row for daily presence
      if (dateCols.length > 0) {
        const rowTotalH: string[] = ['-', '', 'Jumlah Hadir (H)', '-'];
        const rowTotalS: string[] = ['-', '', 'Jumlah Sakit (S)', '-'];
        const rowTotalI: string[] = ['-', '', 'Jumlah Izin (I)', '-'];
        const rowTotalA: string[] = ['-', '', 'Jumlah Alpa (A)', '-'];

        let sumAllH = 0;
        let sumAllS = 0;
        let sumAllI = 0;
        let sumAllA = 0;

        dateCols.forEach(col => {
          if (col.isSunday) {
            rowTotalH.push('L');
            rowTotalS.push('-');
            rowTotalI.push('-');
            rowTotalA.push('-');
            return;
          }
          const att = clsAttendances.find(a => a.date === col.dateStr);
          if (!att) {
            rowTotalH.push('-');
            rowTotalS.push('-');
            rowTotalI.push('-');
            rowTotalA.push('-');
            return;
          }
          let h = 0;
          let s = 0;
          let i = 0;
          let a = 0;
          clsStudents.forEach(std => {
            const st = att.records[std.id]?.status;
            if (st === 'H') h++;
            else if (st === 'S') s++;
            else if (st === 'I') i++;
            else if (st === 'A') a++;
          });
          sumAllH += h;
          sumAllS += s;
          sumAllI += i;
          sumAllA += a;
          rowTotalH.push(h > 0 ? h.toString() : '0');
          rowTotalS.push(s > 0 ? s.toString() : '0');
          rowTotalI.push(i > 0 ? i.toString() : '0');
          rowTotalA.push(a > 0 ? a.toString() : '0');
        });

        rowTotalH.push(sumAllH.toString(), '', '', '', '');
        rowTotalS.push('', sumAllS.toString(), '', '', '');
        rowTotalI.push('', '', sumAllI.toString(), '', '');
        rowTotalA.push('', '', '', sumAllA.toString(), '');

        tableBody.push(rowTotalH);
        tableBody.push(rowTotalS);
        tableBody.push(rowTotalI);
        tableBody.push(rowTotalA);
      }

      autoTable(doc, {
        startY: currentY,
        head: [tableHead],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontSize: useCalendarMode ? 5.5 : 7,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        styles: {
          fontSize: useCalendarMode ? 5.5 : 7,
          cellPadding: useCalendarMode ? 1.2 : 1.8,
          textColor: [30, 41, 59],
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: useCalendarMode ? 5 : 7 },
          1: { halign: 'center', cellWidth: useCalendarMode ? 14 : 18 },
          2: { halign: 'left', cellWidth: useCalendarMode ? 28 : 40 },
          3: { halign: 'center', cellWidth: useCalendarMode ? 5 : 8 },
        },
        margin: { left: 10, right: 10 },
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 6;
    });
  }

  if (reportType === 'FULL' || reportType === 'GRADES') {
    // --- 3. GRADEBOOK & ASSESSMENT RECAP TABLE ---
    filteredClasses.forEach(cls => {
      const clsStudents = sortStudentsByAttendanceNo(
        students.filter(s => s.classId === cls.id && s.active)
      );
      const clsAssessments = assessments.filter(asm => {
        const d = new Date(asm.date);
        // show assessments for this class
        return asm.classId === cls.id;
      });

      if (currentY + 30 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const sectionNum = reportType === 'FULL' ? 'III.' : 'I.';
      doc.text(`${sectionNum} REKAPITULASI DAFTAR NILAI & KETUNTASAN (KKM/KKTP: ${cls.kkm || 75}) - ${cls.name.toUpperCase()}`, 14, currentY + 3);
      currentY += 5;

      const asmHeaders = clsAssessments.map(a => {
        // short title
        const words = a.title.split(' ');
        const short = words.slice(0, 2).join(' ');
        return `${short}\n(B:${a.weight || 1})`;
      });

      const tableHead = [
        'No',
        'NISN',
        'Nama Lengkap Siswa',
        'L/P',
        ...asmHeaders,
        'Nilai Akhir',
        'Predikat',
        'Ketercapaian / Status',
      ];

      const tableBody = clsStudents.map((std, idx) => {
        const gradeSummary = calculateStudentFinalGrade(std.id, clsAssessments, cls.kkm || 75);
        const itemScores = clsAssessments.map(asm => {
          const score = gradeSummary.scoresMap[asm.id];
          return score !== null && score !== undefined ? score.toString() : '-';
        });

        const statusLabel = gradeSummary.isPassed ? 'Tuntas' : 'Perlu Remedial';

        return [
          (std.attendanceNo !== undefined && std.attendanceNo !== null && std.attendanceNo !== '' ? std.attendanceNo : (idx + 1)).toString(),
          std.nisn,
          std.name,
          std.gender,
          ...itemScores,
          gradeSummary.averageScore.toString(),
          gradeSummary.predicate,
          statusLabel,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [tableHead],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 7 },
          1: { halign: 'center', cellWidth: 18 },
          2: { cellWidth: 38 },
          3: { halign: 'center', cellWidth: 8 },
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 6;
    });
  }

  // Draw Signatures on bottom
  drawSignatures(doc, currentY);

  // Add Page Numbers (Halaman X dari Y)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Sistem Administrasi Guru Terpadu  |  Dokumen Resmi Sekolah  |  Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  return doc;
}
