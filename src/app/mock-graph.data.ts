import { FloorArea, GraphEdge, GraphNode, ResourceData } from './models';

export const NODES: GraphNode[] = [
  // Floor 1
  { id: 'n1', name: 'Main Entrance', type: 'room', floor: 1, x: 200, y: 700 },
  { id: 'n2', name: 'Lobby Corridor', type: 'corridor', floor: 1, x: 400, y: 700 },
  { id: 'n3', name: 'Reception', type: 'room', floor: 1, x: 400, y: 600 },
  { id: 'n4', name: 'Hallway A', type: 'corridor', floor: 1, x: 600, y: 700 },
  { id: 'n5', name: 'Emergency Room', type: 'room', floor: 1, x: 600, y: 500 },
  { id: 'n6', name: 'Elevator 1', type: 'elevator', floor: 1, x: 700, y: 700 },
  
  // Floor 2
  { id: 'n7', name: 'Elevator 1 (F2)', type: 'elevator', floor: 2, x: 700, y: 700 },
  { id: 'n8', name: 'Hallway B', type: 'corridor', floor: 2, x: 600, y: 700 },
  { id: 'n9', name: 'ICU', type: 'room', floor: 2, x: 600, y: 500 },
  { id: 'n10', name: 'Surgery Corridor', type: 'corridor', floor: 2, x: 400, y: 700 },
  { id: 'n11', name: 'Operating Room 1', type: 'room', floor: 2, x: 400, y: 600 },
  { id: 'n12', name: 'Recovery Ward', type: 'room', floor: 2, x: 200, y: 700 },
];

export const AREAS: FloorArea[] = [
  // Floor 1 Walls
  { id: 'a1', floor: 1, type: 'room', x: 140, y: 640, width: 120, height: 120, label: 'Main Entrance' },
  { id: 'a2', floor: 1, type: 'corridor', x: 260, y: 670, width: 420, height: 60 },
  { id: 'a3', floor: 1, type: 'corridor', x: 370, y: 620, width: 60, height: 50 },
  { id: 'a4', floor: 1, type: 'room', x: 320, y: 480, width: 160, height: 140, label: 'Reception' },
  { id: 'a5', floor: 1, type: 'corridor', x: 570, y: 570, width: 60, height: 100 },
  { id: 'a6', floor: 1, type: 'room', x: 520, y: 410, width: 160, height: 160, label: 'Emergency Room' },
  { id: 'a7', floor: 1, type: 'elevator', x: 680, y: 670, width: 60, height: 60, label: 'Elevator 1' },
  
  // Floor 2 Walls
  { id: 'a8', floor: 2, type: 'room', x: 100, y: 640, width: 160, height: 120, label: 'Recovery' },
  { id: 'a9', floor: 2, type: 'corridor', x: 260, y: 670, width: 420, height: 60 },
  { id: 'a10', floor: 2, type: 'corridor', x: 370, y: 620, width: 60, height: 50 },
  { id: 'a11', floor: 2, type: 'room', x: 320, y: 480, width: 160, height: 140, label: 'Operating Room 1' },
  { id: 'a12', floor: 2, type: 'corridor', x: 570, y: 570, width: 60, height: 100 },
  { id: 'a13', floor: 2, type: 'room', x: 500, y: 370, width: 200, height: 200, label: 'ICU' },
  { id: 'a14', floor: 2, type: 'elevator', x: 680, y: 670, width: 60, height: 60, label: 'Elevator 1' },
];

export const EDGES: GraphEdge[] = [
  // Floor 1
  { source: 'n1', target: 'n2', distance: 20, direction: 'East' },
  { source: 'n2', target: 'n1', distance: 20, direction: 'West' },
  
  { source: 'n2', target: 'n3', distance: 10, direction: 'North' },
  { source: 'n3', target: 'n2', distance: 10, direction: 'South' },
  
  { source: 'n2', target: 'n4', distance: 20, direction: 'East' },
  { source: 'n4', target: 'n2', distance: 20, direction: 'West' },
  
  { source: 'n4', target: 'n5', distance: 20, direction: 'North' },
  { source: 'n5', target: 'n4', distance: 20, direction: 'South' },
  
  { source: 'n4', target: 'n6', distance: 10, direction: 'East' },
  { source: 'n6', target: 'n4', distance: 10, direction: 'West' },

  // Elevator connecting F1 and F2
  { source: 'n6', target: 'n7', distance: 5, direction: 'Up' },
  { source: 'n7', target: 'n6', distance: 5, direction: 'Down' },

  // Floor 2
  { source: 'n7', target: 'n8', distance: 10, direction: 'West' },
  { source: 'n8', target: 'n7', distance: 10, direction: 'East' },
  
  { source: 'n8', target: 'n9', distance: 20, direction: 'North' },
  { source: 'n9', target: 'n8', distance: 20, direction: 'South' },
  
  { source: 'n8', target: 'n10', distance: 20, direction: 'West' },
  { source: 'n10', target: 'n8', distance: 20, direction: 'East' },
  
  { source: 'n10', target: 'n11', distance: 10, direction: 'North' },
  { source: 'n11', target: 'n10', distance: 10, direction: 'South' },
  
  { source: 'n10', target: 'n12', distance: 20, direction: 'West' },
  { source: 'n12', target: 'n10', distance: 20, direction: 'East' },
];
