import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Manual Domitex',
  tagline: 'Documentación técnica y de mantenimiento',
  favicon: 'img/icon.png',

  // URL de tu sitio de producción
  url: 'https://SirLectric43.github.io',
  baseUrl: '/',

  // Datos actualizados de tu GitHub
  organizationName: 'SirLectric43', 
  projectName: 'proyecto_domitex', 

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', 
        },
        blog: false, 
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Manual de Mantenimiento',
      logo: {
        alt: 'Logo Domitex',
        src: 'img/navbarDomitex.png', 
      },
      items: [
        {
          href: 'https://github.com/SirLectric43/proyecto_domitex',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Comunidad',
          items: [
            {
              label: 'GitHub Repository',
              href: 'https://github.com/SirLectric43/proyecto_domitex',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Domitex. Documentación técnica.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;