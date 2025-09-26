import React, { useCallback, useState } from 'react';
import { validateFileUpload, logSecurityEvent } from '../../utils/security';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Upload, X, AlertTriangle } from 'lucide-react';

interface SecureFileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  currentFile?: File | null;
  className?: string;
}

/**
 * Secure File Upload Component - Validates and secures file uploads
 * Use this for property photo uploads
 */
export function SecureFileUpload({
  onFileSelect,
  onFileRemove,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSizeMB = 10,
  currentFile,
  className = ''
}: SecureFileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const scanFileContent = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Check for suspicious content in file
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /eval\s*\(/i,
          /%3Cscript/i, // URL encoded script
          /<script/i // HTML encoded script
        ];
        
        const isSuspicious = suspiciousPatterns.some(pattern => 
          pattern.test(content)
        );
        
        if (isSuspicious) {
          logSecurityEvent('malicious_file_blocked', {
            filename: file.name,
            fileType: file.type,
            fileSize: file.size
          });
        }
        
        resolve(!isSuspicious);
      };
      
      reader.onerror = () => resolve(false);
      
      // Read as text to scan content
      reader.readAsText(file.slice(0, 1024)); // Only scan first 1KB
    });
  }, []);
  
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setIsScanning(true);
    
    try {
      // Validate file
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        setIsScanning(false);
        return;
      }
      
      // Scan file content for malicious code
      const isFileSafe = await scanFileContent(file);
      if (!isFileSafe) {
        setError('File contains potentially malicious content and has been blocked');
        logSecurityEvent('malicious_file_upload_attempt', {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        setIsScanning(false);
        return;
      }
      
      // Additional checks for image files
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          // Check image dimensions (reasonable limits)
          if (img.width > 8000 || img.height > 8000) {
            setError('Image dimensions too large (max 8000x8000)');
            setIsScanning(false);
            return;
          }
          
          // File passed all checks
          onFileSelect(file);
          setIsScanning(false);
        };
        
        img.onerror = () => {
          setError('Invalid or corrupted image file');
          setIsScanning(false);
        };
        
        img.src = URL.createObjectURL(file);
      } else {
        // Non-image file passed validation
        onFileSelect(file);
        setIsScanning(false);
      }
      
    } catch (error) {
      setError('Failed to process file. Please try again.');
      setIsScanning(false);
      console.error('File upload error:', error);
    }
    
    // Clear the input
    e.target.value = '';
  }, [onFileSelect, scanFileContent]);
  
  const handleRemoveFile = useCallback(() => {
    setError(null);
    if (onFileRemove) {
      onFileRemove();
    }
  }, [onFileRemove]);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {currentFile ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">{currentFile.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isScanning}
          />
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isScanning ? 'Scanning file for security...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxSizeMB}MB • JPEG, PNG, WebP only
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isScanning && (
        <Alert>
          <AlertDescription>
            Scanning file for security threats...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}