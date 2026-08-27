import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PathfindingService } from './pathfinding.service';
import { MapComponent } from './map/map.component';
import { FeedUploadComponent } from './feed-upload/feed-upload.component';
import { GraphNode, RouteOption } from './models';
import { RESOURCES } from './mock-graph.data';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [FormsModule, MapComponent, MatIconModule, FeedUploadComponent],
  templateUrl: './app.html',
})
export class App {
  private pathfinding = inject(PathfindingService);
  
  viewMode = signal<'map' | 'database' | 'upload'>('map');

  nodes = this.pathfinding.getNodes();
  edges = this.pathfinding.getEdges();
  
  groupedNodes = this.nodes.reduce((acc, node) => {
    const group = `Floor ${node.floor}`;
    if (!acc[group]) acc[group] = [];
    acc[group].push(node);
    return acc;
  }, {} as Record<string, GraphNode[]>);

  floorGroups = Object.keys(this.groupedNodes).sort();

  startNodeId = signal<string>('');
  
  resourceTypes = Array.from(new Set(RESOURCES.map(r => r.type))).sort();
  selectedResourceType = signal<string>('');
  
  databaseResources = computed(() => {
    const now = Date.now();
    return RESOURCES.map(res => {
      const targetNode = this.nodes.find(n => n.id === res.nodeId);
      const timeDiffMs = now - new Date(res.timestamp).getTime();
      const mins = Math.floor(timeDiffMs / 60000);
      return {
        ...res,
        nodeName: targetNode?.name || 'Unknown',
        timeAgo: mins <= 0 ? 'Just now' : `${mins} min${mins > 1 ? 's' : 's'} ago`,
        dateFormatted: new Date(res.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  routeOptions = signal<RouteOption[]>([]);
  selectedOptionIdx = signal<number>(-1);

  activeOption = computed(() => this.routeOptions()[this.selectedOptionIdx()]);
  activePath = computed(() => this.activeOption()?.path || []);
  directions = computed(() => this.activeOption()?.directions || []);

  findResources() {
    if (!this.startNodeId() || !this.selectedResourceType()) return;
    
    const opts = this.pathfinding.findResources(this.startNodeId(), this.selectedResourceType());
    this.routeOptions.set(opts);
    this.selectedOptionIdx.set(opts.length > 0 ? 0 : -1);
  }
}
