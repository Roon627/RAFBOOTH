
import { Template } from './types';

export const TEMPLATES: Template[] = [
  {
    id: 'comic-boom',
    name: 'Comic Boom',
    photoCount: 3,
    layout: 'strip',
    color: 'bg-orange-500',
    accent: 'border-yellow-400',
    gradient: 'from-orange-600 via-yellow-500 to-orange-700',
    icon: '💥',
    decorations: ['comic speech bubbles', 'BOOM text', 'OMG stickers', 'bright stars'],
    themeText: 'POW! BOOM!'
  },
  {
    id: 'midnight-manor',
    name: 'Midnight Manor',
    photoCount: 4,
    layout: 'grid',
    color: 'bg-indigo-900',
    accent: 'border-purple-500',
    gradient: 'from-indigo-950 via-purple-900 to-black',
    icon: '🏰',
    decorations: ['haunted castle silhouette', 'flying bats', 'purple moon glow', 'spider webs'],
    themeText: 'SPOOKY NIGHT'
  },
  {
    id: 'pumpkin-patch',
    name: 'Pumpkin Patch',
    photoCount: 3,
    layout: 'grid',
    color: 'bg-orange-700',
    accent: 'border-orange-300',
    gradient: 'from-orange-800 via-orange-600 to-yellow-700',
    icon: '🎃',
    decorations: ['smiling pumpkins', 'autumn leaves', 'twisting vines', 'scarecrows'],
    themeText: 'HAPPY HALLOWEEN'
  },
  {
    id: 'ghostly-white',
    name: 'Ghostly Fun',
    photoCount: 1,
    layout: 'single',
    color: 'bg-slate-800',
    accent: 'border-white',
    gradient: 'from-slate-900 via-indigo-900 to-slate-800',
    icon: '👻',
    decorations: ['cute floating ghosts', 'white spider webs', 'shimmering mist'],
    themeText: 'BOO TO YOU!'
  },
  {
    id: 'witch-magic',
    name: 'Witch Magic',
    photoCount: 4,
    layout: 'strip',
    color: 'bg-purple-800',
    accent: 'border-emerald-400',
    gradient: 'from-purple-900 via-emerald-900 to-black',
    icon: '🧙‍♀️',
    decorations: ['witch hats', 'bubbling cauldrons', 'green magic sparkles', 'black cats'],
    themeText: 'WICKED CUTE'
  },
  {
    id: 'spider-web',
    name: 'Spider Web',
    photoCount: 3,
    layout: 'strip',
    color: 'bg-neutral-900',
    accent: 'border-slate-500',
    gradient: 'from-black via-slate-900 to-black',
    icon: '🕷️',
    decorations: ['intricate spider webs', 'cute hanging spiders', 'silver glitter'],
    themeText: 'WEB OF FUN'
  }
];
