import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PathfindingService } from './pathfinding.service';
import { MapComponent } from './map/map.component';
import { GraphNode } from './models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [FormsModule, MapComponent, MatIconModule],
  templateUrl: './app.html',
})
export class App {
  private pathfinding = inject(PathfindingService);
  
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
  endNodeId = signal<string>('');
  
  activePath = signal<GraphNode[]>([]);
  directions = signal<string[]>([]);

  calculatePath() {
    if (!this.startNodeId() || !this.endNodeId()) return;
    
    const result = this.pathfinding.getShortestPath(this.startNodeId(), this.endNodeId());
    this.activePath.set(result.path);
    this.directions.set(result.directions);
  }
}
