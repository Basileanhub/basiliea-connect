import type { ReactNode } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

export function StudioSort({ ids, onOrder, children }: { ids: string[]; onOrder: (ids: string[]) => void; children: ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function end(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const next = [...ids]; const from = next.indexOf(String(event.active.id)); const to = next.indexOf(String(event.over.id));
    if (from < 0 || to < 0) return;
    const [id] = next.splice(from, 1); if (!id) return; next.splice(to, 0, id); onOrder(next);
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={ids} strategy={verticalListSortingStrategy}>{children}</SortableContext></DndContext>;
}
export function StudioSortableItem({ id, children, first, last, move }: { id: string; children: ReactNode; first: boolean; last: boolean; move: (step: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="studio-sort-item">
    <div className="studio-sort-tools">
      <Button variant="ghost" size="icon" {...attributes} {...listeners} aria-label="Drag to reorder" title="Drag to reorder" className="drag-handle"><GripVertical size={18} /></Button>
      <Button variant="ghost" size="icon" disabled={first} aria-label="Move up" title="Move up" onClick={() => move(-1)}><ChevronUp size={16} /></Button>
      <Button variant="ghost" size="icon" disabled={last} aria-label="Move down" title="Move down" onClick={() => move(1)}><ChevronDown size={16} /></Button>
    </div>{children}
  </article>;
}