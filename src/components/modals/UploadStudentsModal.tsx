import React, { useState, useRef } from 'react';
import { ClassRoom, Student } from '../../types';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Trash2,
  HelpCircle,
  Users,
} from 'lucide-react';

interface UploadStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  selectedClassId?: string;
  onImportStudents: (
    targetClassId: string,
    newStudents: Omit<Student, 'id'>[],
    mode: 'append' | 'replace'
  ) => void;
}

interface ParsedStudentRow {
  attendanceNo?: number;
  nisn: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  isValid: boolean;
  error?: string;
}

export const UploadStudentsModal: React.FC<UploadStudentsModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onImportStudents,
}) => {
  const [classId, setClassId] = useState<string>(
    selectedClassId || (classes[0]?.id ?? '')
  );
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [inputTab, setInputTab] = useState<'file' | 'paste'>('file');
  const [rawText, setRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetClass = classes.find((c) => c.id === classId);

  // Helper parser for CSV/TSV or line-by-line paste
  const parseStudentText = (text: string): ParsedStudentRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    const rows: ParsedStudentRow[] = [];

    // Check if line 0 is a header line
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes('nama') ||
      firstLineLower.includes('nisn') ||
      firstLineLower.includes('name') ||
      firstLineLower.includes('gender') ||
      firstLineLower.includes('jk') ||
      firstLineLower.includes('absen')
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Delimiters: comma, semicolon, or tab
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else {
        // Space separated fallback if at least 3 parts
        parts = line.split(/\s{2,}/);
        if (parts.length < 2) {
          parts = [line];
        }
      }

      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      let attendanceNo: number | undefined = undefined;
      let nisn = '';
      let nis = '';
      let name = '';
      let gender: 'L' | 'P' = 'L';

      // Check if first column is simple index or absen (e.g. 1 to 50)
      if (parts.length >= 5) {
        // Format: No/Absen | NISN | NIS | Nama | JK
        if (/^\d{1,3}$/.test(parts[0])) {
          attendanceNo = parseInt(parts[0], 10);
          nisn = parts[1];
          nis = parts[2];
          name = parts[3];
          const gRaw = parts[4].toUpperCase();
          gender = gRaw.startsWith('P') || gRaw.startsWith('W') || gRaw.includes('PEREMPUAN') ? 'P' : 'L';
        } else {
          nisn = parts[0];
          nis = parts[1];
          name = parts[2];
          const gRaw = parts[3].toUpperCase();
          gender = gRaw.startsWith('P') || gRaw.startsWith('W') || gRaw.includes('PEREMPUAN') ? 'P' : 'L';
          if (/^\d+$/.test(parts[4])) {
            attendanceNo = parseInt(parts[4], 10);
          }
        }
      } else if (parts.length === 4) {
        // Could be: No | NISN | Nama | JK  OR  NISN | NIS | Nama | JK
        if (/^\d{1,3}$/.test(parts[0]) && parts[1].length >= 8) {
          attendanceNo = parseInt(parts[0], 10);
          nisn = parts[1];
          name = parts[2];
          const gRaw = parts[3].toUpperCase();
          gender = gRaw.startsWith('P') || gRaw.startsWith('W') || gRaw.includes('PEREMPUAN') ? 'P' : 'L';
          nis = nisn ? nisn.slice(-6) : '';
        } else {
          nisn = parts[0];
          nis = parts[1];
          name = parts[2];
          const gRaw = parts[3].toUpperCase();
          gender = gRaw.startsWith('P') || gRaw.startsWith('W') || gRaw.includes('PEREMPUAN') ? 'P' : 'L';
        }
      } else if (parts.length === 3) {
        nisn = parts[0];
        name = parts[1];
        const gRaw = parts[2].toUpperCase();
        gender = gRaw.startsWith('P') || gRaw.startsWith('W') || gRaw.includes('PEREMPUAN') ? 'P' : 'L';
        nis = nisn ? nisn.slice(-6) : '';
      } else if (parts.length === 2) {
        if (/^\d+$/.test(parts[0])) {
          nisn = parts[0];
          name = parts[1];
        } else {
          name = parts[0];
          const gRaw = parts[1].toUpperCase();
          gender = gRaw.startsWith('P') ? 'P' : 'L';
        }
      } else if (parts.length === 1) {
        name = parts[0];
      }

      // Cleanup
      name = name.trim();
      nisn = nisn.trim();
      nis = nis.trim();

      // Basic validation
      let isValid = true;
      let error = '';
      if (!name) {
        isValid = false;
        error = 'Nama tidak boleh kosong';
      }

      if (name) {
        rows.push({
          attendanceNo: attendanceNo || (rows.length + 1),
          nisn: nisn || Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          nis: nis || (nisn ? nisn.slice(-6) : Math.floor(100000 + Math.random() * 900000).toString()),
          name,
          gender,
          isValid,
          error,
        });
      }
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseStudentText(text);
        setParsedRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteChange = (text: string) => {
    setRawText(text);
    const parsed = parseStudentText(text);
    setParsedRows(parsed);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'No Absen,NISN,NIS,Nama Lengkap,Jenis Kelamin (L/P)\n' +
      '1,0098765401,25260701,Ahmad Rizky Pratama,L\n' +
      '2,0098765402,25260702,Annisa Rahmawati,P\n' +
      '3,0098765403,25260703,Bagas Dwi Santoso,L\n' +
      '4,0098765404,25260704,Cantika Putri Permata,P\n' +
      '5,0098765405,25260705,Daffa Arya Maulana,L';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const classNameClean = targetClass?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Kelas';
    link.setAttribute('download', `template_siswa_${classNameClean}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleData = () => {
    const sample =
      '1\t0098765501\t25260751\tFikri Firmansyah\tL\n' +
      '2\t0098765502\t25260752\tGendis Ayuningtyas\tP\n' +
      '3\t0098765503\t25260753\tHaekal Ramadhan\tL\n' +
      '4\t0098765504\t25260754\tIntan Nuraini\tP\n' +
      '5\t0098765505\t25260755\tJoko Susilo\tL\n' +
      '6\t0098765506\t25260756\tKhansa Salsabila\tP\n' +
      '7\t0098765507\t25260757\tLuqman Hakim\tL\n' +
      '8\t0098765508\t25260758\tMeutia Zahra\tP';
    setInputTab('paste');
    handlePasteChange(sample);
  };

  const handleConfirmImport = () => {
    const validStudents = parsedRows
      .filter((r) => r.isValid)
      .map((r, idx) => ({
        attendanceNo: r.attendanceNo || (idx + 1),
        nisn: r.nisn,
        nis: r.nis,
        name: r.name,
        gender: r.gender,
        classId,
        active: true,
      }));

    if (validStudents.length === 0) {
      alert('Tidak ada data siswa valid yang siap diimpor.');
      return;
    }

    onImportStudents(classId, validStudents, importMode);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const lCount = parsedRows.filter((r) => r.isValid && r.gender === 'L').length;
  const pCount = parsedRows.filter((r) => r.isValid && r.gender === 'P').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-[#0B1120] border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Unggah & Impor Siswa Per Kelas
              </h3>
              <p className="text-xs text-slate-400">
                Impor daftar siswa secara massal melalui berkas CSV/Excel atau salin-tempel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300">
          {/* Class & Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0B1120] border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Target Kelas <span className="text-blue-400">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0F172A] text-white"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.gradeLevel} - {cls.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Metode Impor Data
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    importMode === 'append'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Tambahkan (Append)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Mengganti seluruh data siswa yang ada di kelas ini dengan data baru"
                >
                  Ganti Semua (Replace)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions / Template Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputTab('file')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  inputTab === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unggah Berkas (CSV/TXT)
              </button>
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  inputTab === 'paste'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                Salin & Tempel Teks
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-blue-400 border border-blue-500/30 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template CSV
              </button>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Muat Contoh
              </button>
            </div>
          </div>

          {/* Input Method A: File Upload */}
          {inputTab === 'file' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-[#0B1120]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                {fileName ? fileName : 'Pilih atau Tarik Berkas CSV / Excel ke Sini'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                Format kolom: <span className="text-slate-200 font-mono">No Absen, NISN, NIS, Nama Lengkap, Jenis Kelamin (L/P)</span>
              </p>
              <span className="inline-block text-xs font-semibold px-4 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors">
                Jelajahi Berkas Komputer
              </span>
            </div>
          )}

          {/* Input Method B: Direct Paste */}
          {inputTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tempelkan data dari Excel atau teks tabel (pisahkan dengan koma/tab):</span>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setParsedRows([]);
                    }}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Bersihkan
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`Contoh:\n1\t0098765401\t25260701\tAditya Pratama\tL\n2\t0098765402\t25260702\tAnisa Rahma Putri\tP\n3\t0098765403\t25260703\tBagus Tri Handoko\tL`}
                className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-slate-200"
              />
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0B1120] space-y-0">
              <div className="p-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    Pratinjau Hasil Impor ({validCount} Siswa Terdeteksi)
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      L: {lCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-400 border border-pink-500/30">
                      P: {pCount}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Target: <span className="font-bold text-blue-400">{targetClass?.name}</span>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-slate-800">
                {parsedRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 flex items-center justify-between text-xs ${
                      row.isValid ? 'bg-[#0F172A]' : 'bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-blue-400 font-bold w-6">#{row.attendanceNo || idx + 1}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{row.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          NISN: {row.nisn} | NIS: {row.nis}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 font-bold rounded ${
                          row.gender === 'L'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                        }`}
                      >
                        {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      {row.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {row.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Info Box */}
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-xs text-slate-300">
            <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Petunjuk Impor Siswa:</span>
              <p className="text-slate-400">
                Sistem secara cerdas membaca kolom: No Absen, NISN, NIS, Nama Lengkap, dan Jenis Kelamin (L/P). Jika No Absen atau NISN tidak diisi, sistem akan membuatkan nomor urut otomatis.
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={validCount === 0}
              onClick={handleConfirmImport}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer ${
                validCount > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Impor {validCount} Siswa ke {targetClass?.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
