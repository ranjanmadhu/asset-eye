import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GraphEdge, GraphNode, FloorArea } from '../models';
import { AREAS } from '../mock-graph.data';

@Component({
  selector: 'app-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent {
  nodes = input.required<GraphNode[]>();
  edges = input.required<GraphEdge[]>();
  activePath = input.required<GraphNode[]>();
  
  areas = AREAS;

  floors = computed(() => {
    const f = new Set(this.nodes().map(n => n.floor));
    return Array.from(f).sort((a, b) => a - b);
  });

  activePathIds = computed(() => new Set(this.activePath().map(n => n.id)));

  getNodesForFloor(floor: number): GraphNode[] {
    return this.nodes().filter(n => n.floor === floor);
  }

  getEdgesForFloor(floor: number): GraphEdge[] {
    const fNodes = new Set(this.getNodesForFloor(floor).map(n => n.id));
    return this.edges().filter(e => fNodes.has(e.source) && fNodes.has(e.target));
  }

  getAreasForFloor(floor: number): FloorArea[] {
    return this.areas.filter(a => a.floor === floor);
  }

  getActiveSegmentsForFloor(floor: number) {
    const segments = [];
    const path = this.activePath();
    if (!path || path.length < 2) return [];
    for (let i = 0; i < path.length - 1; i++) {
      const source = path[i];
      const target = path[i+1];
      if (source.floor === floor && target.floor === floor) {
        segments.push({
          source,
          target,
          midX: (source.x + target.x) / 2,
          midY: (source.y + target.y) / 2
        });
      }
    }
    return segments;
  }

  getNodeDetails(id: string): GraphNode | undefined {
    return this.nodes().find(n => n.id === id);
  }

  isNodeActive(id: string): boolean {
    return this.activePathIds().has(id);
  }
  
  getNodeColor(type: string): string {
    switch(type) {
      case 'room': return '#60a5fa'; // blue-400
      case 'corridor': return '#9ca3af'; // gray-400
      case 'elevator': return '#f43f5e'; // rose-500
      default: return '#cbd5e1';
    }
  }
}
