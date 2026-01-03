import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { datasetAPI } from '../../services/api';
import type { Dataset } from '../../types';

interface UploadStepProps {
  onUploadComplete: (dataset: Dataset) => void;
}

export default function UploadStep({ onUploadComplete }: UploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Format de fichier invalide. Seuls les fichiers Excel (.xlsx, .xls) et CSV sont acceptés.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux. Taille maximum : 10MB.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const response = await datasetAPI.upload(file);
      const data = response.data;

      setPreviewData(data);

      // Auto-proceed after showing preview
      setTimeout(() => {
        onUploadComplete(data.dataset);
      }, 1500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Erreur lors du téléchargement du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Importer un fichier Excel
        </h2>
        <p className="text-gray-600">
          Téléchargez votre fichier Ranklist au format Excel (.xlsx) ou CSV
        </p>
      </div>

      {/* Upload area */}
      {!previewData && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleChange}
            disabled={isUploading}
          />

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Glissez-déposez votre fichier ici
              </p>
              <p className="text-sm text-gray-500">
                ou cliquez sur le bouton ci-dessous
              </p>
            </div>

            <button
              type="button"
              onClick={onButtonClick}
              disabled={isUploading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isUploading ? 'Téléchargement en cours...' : 'Sélectionner un fichier'}
            </button>

            <p className="text-xs text-gray-500">
              Formats acceptés : Excel (.xlsx, .xls) et CSV • Taille max : 10MB
            </p>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Analyse du fichier en cours...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Fichier importé avec succès !</p>
              <p className="text-sm">
                {previewData.dataset.rowCount} lignes détectées • Feuille : {previewData.dataset.sheetName}
              </p>
            </div>
          </div>

          {/* Stats */}
          {previewData.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Total collaborateurs</p>
                <p className="text-2xl font-bold text-gray-900">{previewData.stats.totalRows}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Unités totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {previewData.stats.totalUnits.toFixed(0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Catégories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {previewData.stats.uniqueRankCategories}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Coachs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {previewData.stats.uniqueCoaches}
                </p>
              </div>
            </div>
          )}

          {/* Preview table */}
          {previewData.preview && previewData.preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Aperçu des données (20 premières lignes)
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unités perso</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unités global</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.preview.slice(0, 10).map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{row.fullName || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{row.rankCategory || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">{row.unitsBrutPersonal.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">{row.unitsBrutGlobal.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right font-medium">{row.totalUnits.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center animate-pulse">
            Passage à l'étape suivante...
          </p>
        </div>
      )}
    </div>
  );
}





