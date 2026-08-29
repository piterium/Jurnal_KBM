import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppData, ClassRoom } from '../types';
import {
  MONTH_NAMES_ID,
  calculateStudentAttendanceSummary,
  calculateStudentFinalGrade,
  getJournalAttendanceInfo,
  formatShortDateIndonesian,
} from './storage';

export interface GeneratePdfOptions {
  month: number; // 1 - 12
  year: number; // e.g. 2026
  classId?: string; // specific class or all
  reportType: 'FULL' | 'JOURNAL' | 'ATTENDANCE' | 'GRADES';
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
    const startY = 12;

    // Draw school logo if available
    if (profile.logoUrl && profile.logoUrl.startsWith('data:image')) {
      try {
        currentDoc.addImage(profile.logoUrl, 14, 10, 20, 20);
      } catch (e) {
        console.warn('Could not add logo image to PDF:', e);
      }
    }

    currentDoc.setFont('helvetica', 'bold');
    currentDoc.setFontSize(11);
    currentDoc.setTextColor(30, 41, 59);

    const headerOfficeLines = profile.letterHeaderOffice ? profile.letterHeaderOffice.split('\n') : ['PEMERINTAH KOTA / KABUPATEN', 'DINAS PENDIDIKAN DAN KEBUDAYAAN'];
    let curY = startY;
    headerOfficeLines.forEach(line => {
      currentDoc.text(line.toUpperCase(), pageWidth / 2, curY, { align: 'center' });
      curY += 4.5;
    });

    currentDoc.setFontSize(14);
    currentDoc.setTextColor(15, 23, 42);
    currentDoc.text(profile.schoolName.toUpperCase(), pageWidth / 2, curY, { align: 'center' });
    curY += 4.5;

    currentDoc.setFont('helvetica', 'normal');
    currentDoc.setFontSize(8.5);
    currentDoc.setTextColor(71, 85, 105);
    const addressStr = `${profile.schoolAddress} | NPSN: ${profile.npsn} | ${profile.districtCity}, ${profile.province}`;
    currentDoc.text(addressStr, pageWidth / 2, curY, { align: 'center' });
    curY += 3.5;

    // Double lines for Kop Surat
    currentDoc.setDrawColor(30, 41, 59);
    currentDoc.setLineWidth(0.8);
    currentDoc.line(14, curY, pageWidth - 14, curY);
    currentDoc.setLineWidth(0.3);
    currentDoc.line(14, curY + 1.2, pageWidth - 14, curY + 1.2);

    return curY + 5;
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
        ? (attInfo.isNihil ? 'Nihil' : attInfo.summaryText)
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
      ];
    }) : [[
      '-', '-', '-', '-', '-', 'Tidak ada data jurnal mengajar pada periode bulan ini.', '-', '-'
    ]];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Kelas', 'Pert.', 'Jam Ke- (JP)', 'Materi Pokok / Bahasan Pembelajaran', 'Presensi', 'Status']],
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
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'center', cellWidth: 24 },
        5: { cellWidth: 54 },
        6: { halign: 'center', cellWidth: 20 },
        7: { halign: 'center', cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 6;
  }

  if (reportType === 'FULL' || reportType === 'ATTENDANCE') {
    // --- 2. ATTENDANCE SUMMARY TABLE ---
    filteredClasses.forEach(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id && s.active);
      const clsAttendances = attendances.filter(a => {
        const d = new Date(a.date);
        return a.classId === cls.id && (d.getMonth() + 1) === month && d.getFullYear() === year;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (currentY + 30 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const sectionNum = reportType === 'FULL' ? 'II.' : 'I.';
      doc.text(`${sectionNum} REKAPITULASI PRESENSI SISWA - ${cls.name.toUpperCase()}`, 14, currentY + 3);
      currentY += 5;

      // Build attendance table columns
      // If ATTENDANCE matrix mode, show dates as columns if there are <= 10 dates
      const dateHeaders = clsAttendances.map(a => {
        const p = a.date.split('-');
        return `${p[2]}/${p[1]}`;
      });

      const tableHead = [
        'No',
        'NISN',
        'Nama Lengkap Siswa',
        'L/P',
        ...dateHeaders,
        'H',
        'S',
        'I',
        'A',
        '% Hadir',
      ];

      const tableBody = clsStudents.map((std, idx) => {
        const summary = calculateStudentAttendanceSummary(std.id, clsAttendances);
        const dateStatuses = clsAttendances.map(a => {
          const st = a.records[std.id]?.status || '-';
          return st;
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
          2: { cellWidth: 40 },
          3: { halign: 'center', cellWidth: 8 },
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 6;
    });
  }

  if (reportType === 'FULL' || reportType === 'GRADES') {
    // --- 3. GRADEBOOK & ASSESSMENT RECAP TABLE ---
    filteredClasses.forEach(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id && s.active);
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
