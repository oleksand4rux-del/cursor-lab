import { useMemo } from 'react'
import { Grid3x3, MousePointer2, Waypoints } from 'lucide-react'
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/motion/file-tree'
import { Tabs, TabsList, TabsTrigger } from '@/components/motion/tabs'
import { DESIGN, ANIMATED, type Entry, type Tab } from '@/cursors'
import { groupsOf, listOf } from '@/lib/catalog'
import { cn } from '@/lib/utils'

const GROUP_ICON: Record<string, typeof MousePointer2> = {
  Pointer: MousePointer2,
  Trail: Waypoints,
  Field: Grid3x3,
}

function EntryIcon({ entry }: { entry: Entry }) {
  if (entry.kind === 'design') {
    return (
      <span
        className={cn('grid size-4 place-items-center [&>svg]:size-4', entry.pixel && '[&>svg]:[image-rendering:pixelated]')}
        dangerouslySetInnerHTML={{ __html: entry.svg }}
      />
    )
  }
  const Icon = GROUP_ICON[entry.group] ?? MousePointer2
  return <Icon className="size-4" strokeWidth={1.5} />
}

type Props = {
  tab: Tab
  onTab: (t: Tab) => void
  selected: string
  onSelect: (id: string) => void
  className?: string
}

export function Catalogue({ tab, onTab, selected, onSelect, className }: Props) {
  const groups = useMemo(() => groupsOf(listOf(tab)), [tab])
  const folderIds = useMemo(() => groups.map((g) => 'group:' + g.name), [groups])

  return (
    <nav aria-label="Cursor catalogue" className={cn('catalogue flex min-h-0 flex-col', className)}>
      {/* a recessed track with a raised key: the switch you press, not a banner */}
      <Tabs value={tab} onValueChange={(v) => onTab(v as Tab)} variant="segment">
        <TabsList className="w-full bg-deep p-1" wrapperClassName="w-full">
          <TabsTrigger value="animated" className="h-8 flex-1 gap-1.5 py-0 text-[13px]" indicatorClassName="bg-raised">
            Animated<span className="tabular-nums text-faint">{ANIMATED.length}</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="h-8 flex-1 gap-1.5 py-0 text-[13px]" indicatorClassName="bg-raised">
            Design<span className="tabular-nums text-faint">{DESIGN.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="-mx-1 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
        <FileTree
          key={tab}
          ariaLabel={tab === 'design' ? 'Design cursors' : 'Animated cursors'}
          value={selected}
          onValueChange={(v) => { if (!v.startsWith('group:')) onSelect(v) }}
          defaultExpandedIds={folderIds}
          indent={14}
          classNames={{ icon: 'tree-icon' }}
        >
          {groups.map((g) => (
            <FileTreeFolder key={g.name} value={'group:' + g.name} name={g.name}>
              {g.items.map((e) => (
                <FileTreeFile key={e.id} value={e.id} name={e.name} icon={<EntryIcon entry={e} />} />
              ))}
            </FileTreeFolder>
          ))}
        </FileTree>
      </div>
    </nav>
  )
}
