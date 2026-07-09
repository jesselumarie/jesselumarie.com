/* Site-specific data for the FF7 shell on jesselumarie.com.
   Another site swaps this file (and screens.js) and reuses
   ff7.js/ff7.css untouched. */
var FF7_MANIFEST = {
  blogIndexUrl: '/blog/blogindex.json',
  blogFallbackUrl: '/blog',

  /* Equip-screen content. Facts sourced from landing_page/about/index.html:
     software developer, (former) lawyer, Boulder CO, and the social links. */
  about: {
    fallbackUrl: '/about',
    bio: [
      "My name is Jesse and I'm a software developer and (former) lawyer currently living in Boulder, Colorado.",
      'Give me a shout via PHS or at any of the fine establishments below.'
    ],
    equipment: [
      { slot: 'Wpn.', name: 'Keyboard', desc: 'Standard-issue software developer weapon.' },
      { slot: 'Arm.', name: 'Law degree', desc: 'Former lawyer. Grants resistance to fine print.' },
      { slot: 'Acc.', name: 'Boulder, CO', desc: 'Currently equipped home base in Colorado.' }
    ],
    materia: [
      { name: 'Writing', color: 'green', href: '#/writing', hint: "Read Jesse's writing." },
      { name: 'GitHub', color: 'purple', href: 'https://github.com/jesselumarie', hint: "Inspect Jesse's materia." },
      { name: 'LinkedIn', color: 'yellow', href: 'https://www.linkedin.com/in/jesselumarie', hint: 'Employment record and battle history.' },
      { name: 'Twitter', color: 'blue', href: 'https://twitter.com/jesselumarie', hint: 'Short-form dispatches.' },
      { name: 'Instagram', color: 'red', href: 'https://instagram.com/jesselumarie', hint: 'Field photography.' },
      { name: 'PHS', color: 'yellow', href: 'mailto:jesse.lumarie@gmail.com', hint: 'PHS — send Jesse a message.' }
    ]
  }
};
