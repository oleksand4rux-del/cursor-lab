/* What changed, newest first. Written from the commit history; one entry per
   day something shipped. Add to the top when you ship. */
export type Release = { date: string; title: string; notes: string[] }

export const CHANGELOG: Release[] = [
  {
    date: '2026-11-20',
    title: 'A new interface',
    notes: [
      'Rebuilt on React with beUI components; the stage now fills the window and the panels float over it',
      'Parameters live in DialKit’s own floating panel: drag it anywhere, fold it to an icon',
      'Every panel opens with Colours: Shuffle colours and Randomize gradient, then the fill, gradient and end colour',
      'On and off settings are switches',
      'The catalogue is a folder tree, and the dock shows where the pointer is on the stage',
      'Your tuning stays when you leave a cursor and come back',
    ],
  },
  {
    date: '2026-09-06',
    title: 'ASCII Field',
    notes: [
      'New field cursor: a character grid that the pointer writes into, then fades',
      'Five character sets: Codex, Dots, Binary, Blocks and Mix',
      'A fresh link-preview card',
    ],
  },
  {
    date: '2026-08-29',
    title: 'Logo and link previews',
    notes: [
      'The Cursor Lab mark in the header and the favicon',
      'A preview card when the link is shared',
    ],
  },
  {
    date: '2026-08-28',
    title: 'First release',
    notes: [
      '27 cursors, drawn and animated, each one live with every parameter tunable',
      'Code in JavaScript, React and CSS, generated from the values you tuned',
      'Live GitHub star count and the date of the last update',
    ],
  },
]
