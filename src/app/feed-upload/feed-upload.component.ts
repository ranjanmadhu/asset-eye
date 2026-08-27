import {DecimalPipe} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, inject, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';

import {DetectionMetadata, FeedUploadResponse, GraphNode} from '../models';
import {PathfindingService} from '../pathfinding.service';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-feed-upload',
  imports: [MatIconModule, DecimalPipe, FormsModule],
  templateUrl: './feed-upload.component.html',
})
export class FeedUploadComponent {
  private http = inject(HttpClient);
  private pathfinding = inject(PathfindingService);

  processed = output<void>();

  nodes = this.pathfinding.getNodes();
  groupedNodes = this.nodes.reduce((acc, node) => {
    const group = `Floor ${node.floor}`;
    (acc[group] ??= []).push(node);
    return acc;
  }, {} as Record<string, GraphNode[]>);
  floorGroups = Object.keys(this.groupedNodes).sort();

  nodeId = signal<string>('');
  file = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  uploading = signal(false);
  error = signal<string | null>(null);
  storedName = signal<string | null>(null);
  record = signal<DetectionMetadata | null>(null);
  detectionError = signal<string | null>(null);
  dragging = signal(false);

  onFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.select(input.files?.[0] ?? null);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    this.select(event.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave() {
    this.dragging.set(false);
  }

  clear() {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.file.set(null);
    this.previewUrl.set(null);
    this.error.set(null);
    this.storedName.set(null);
    this.record.set(null);
    this.detectionError.set(null);
  }

  async upload() {
    const file = this.file();
    const nodeId = this.nodeId();
    if (!file || !nodeId || this.uploading()) return;

    this.uploading.set(true);
    this.error.set(null);
    this.storedName.set(null);
    this.record.set(null);
    this.detectionError.set(null);

    try {
      const data = await this.toBase64(file);
      const res = await this.http
        .post<FeedUploadResponse>('/api/feed-upload', {
          fileName: file.name,
          mimeType: file.type,
          nodeId,
          data,
        })
        .toPromise();
      this.storedName.set(res?.storedName ?? null);
      this.record.set(res?.record ?? null);
      this.detectionError.set(res?.detectionError ?? null);
      this.processed.emit();
    } catch {
      this.error.set('Upload failed. Please try again.');
    } finally {
      this.uploading.set(false);
    }
  }

  private select(file: File | null) {
    this.clear();
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Only PNG, JPEG, WEBP or GIF images are accepted.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.error.set('Image exceeds the 10 MB limit.');
      return;
    }

    this.file.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read-failed'));
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.slice(result.indexOf(',') + 1));
      };
      reader.readAsDataURL(file);
    });
  }
}
