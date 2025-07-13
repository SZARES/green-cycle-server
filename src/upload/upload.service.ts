import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import * as streamifier from 'streamifier';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  
  uploadToCloudinaryMulter(
    file: Express.Multer.File,
    options: Partial<UploadApiOptions> = { resource_type: 'auto' }
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        ...options,
        folder: options.resource_type === 'video' ? 'audio_tracks' : 'images',
        chunk_size: 6000000, 
        timeout: 480000, 
      };

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (result) {
            resolve(result);
          } else {
            console.error('Cloudinary upload error:', error);
            reject(new Error(error.message));
          }
        },
      );

      // Manejar errores del stream
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(new Error('Error in upload stream'));
      });

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }

  async uploadAudio(file: Express.Multer.File): Promise<UploadApiResponse> {
    const result = await this.uploadToCloudinaryMulter(file, { 
      resource_type: 'video'
    });
    
    return result;
  }

  // Método para subir múltiples imágenes
  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadToCloudinaryMulter(file));
    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
  }

  // Método para verificar si una URL es de Cloudinary
  isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com');
  }

  // Método para obtener el public_id de una URL de Cloudinary
  getPublicIdFromUrl(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }

  // Método para eliminar múltiples imágenes
  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map(publicId =>
      new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      })
    );
    await Promise.all(deletePromises);
  }
}