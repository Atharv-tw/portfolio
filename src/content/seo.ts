/**
 * Turns the site's content into what machines read: <head> tags, schema.org
 * data, a plain-HTML copy of the page, robots.txt, sitemap.xml and llms.txt.
 *
 * Pure functions, no browser or build APIs — vite.config.ts calls them.
 * Nothing here is written by hand twice: it all comes from resume.ts.
 */
import { archive, experience, featured, now, outside, person, trackRecord, type Project } from './resume'
import { site } from './site'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const abs = (path: string) => site.url + path
const roles = site.jobTitles.join(', ')

export interface HeadTag {
  tag: 'meta' | 'link' | 'script'
  attrs: Record<string, string>
  children?: string
}

/** schema.org graph: the site, the profile page, and the person it is about */
function structuredData(today: string) {
  const personId = abs('/#person')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': abs('/#website'),
        url: abs('/'),
        name: person.name,
        description: site.description,
        inLanguage: 'en',
      },
      {
        '@type': 'ProfilePage',
        '@id': abs('/#profile'),
        url: abs('/'),
        name: site.title,
        isPartOf: { '@id': abs('/#website') },
        mainEntity: { '@id': personId },
        dateModified: today,
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: person.name,
        givenName: person.firstName,
        url: abs('/'),
        image: abs(site.image),
        description: site.description,
        jobTitle: site.jobTitles,
        email: `mailto:${person.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'New Delhi', addressCountry: 'IN' },
        sameAs: [person.github.url, person.linkedin.url],
        knowsAbout: site.knowsAbout,
        worksFor: experience
          .filter((r) => r.id === 'nexera')
          .map((r) => ({ '@type': 'Organization', name: r.company, ...(r.site ? { url: `https://${r.site}` } : {}) })),
        memberOf: experience
          .filter((r) => r.id === 'aairo')
          .map((r) => ({ '@type': 'Organization', name: r.company, description: r.site })),
        affiliation: {
          '@type': 'CollegeOrUniversity',
          name: 'Guru Gobind Singh Indraprastha University (GGSIPU)',
        },
      },
    ],
  }
}

/** everything that belongs in <head> besides the title */
export function headTags(today: string): HeadTag[] {
  const meta = (name: string, content: string): HeadTag => ({ tag: 'meta', attrs: { name, content } })
  const og = (property: string, content: string): HeadTag => ({ tag: 'meta', attrs: { property, content } })
  return [
    meta('description', site.description),
    meta('author', person.name),
    meta('keywords', [person.name, ...site.jobTitles, 'ML Engineer', 'AI/ML Engineer', 'Nexera CTO', 'New Delhi'].join(', ')),
    meta('robots', 'index, follow, max-image-preview:large, max-snippet:-1'),
    { tag: 'link', attrs: { rel: 'canonical', href: abs('/') } },
    og('og:type', 'profile'),
    og('og:site_name', person.name),
    og('og:title', site.title),
    og('og:description', site.description),
    og('og:url', abs('/')),
    og('og:image', abs(site.image)),
    og('og:locale', site.locale),
    og('profile:first_name', person.firstName),
    og('profile:last_name', person.name.replace(person.firstName, '').trim()),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', site.title),
    meta('twitter:description', site.description),
    meta('twitter:image', abs(site.image)),
    { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(structuredData(today)) },
  ]
}

const li = (items: readonly string[]) => (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '')

function projectHtml(p: Project) {
  const links = [
    p.links.repo && `<a href="${esc(p.links.repo)}">Repository</a>`,
    p.links.live && `<a href="${esc(p.links.live)}">Live</a>`,
    p.links.caseStudy && `<a href="${esc(p.links.caseStudy)}">Case study</a>`,
  ].filter(Boolean)
  if (p.media.youtube) links.push(`<a href="https://youtu.be/${esc(p.media.youtube)}">Demo video</a>`)
  // the technical sections: specs and points as lists, a table as a real table
  const deep = (p.deep ?? []).map((d) =>
    [
      `<h4>${esc(d.title)}</h4>`,
      li((d.specs ?? []).map((x) => `${x.label}: ${x.value}`)),
      d.table
        ? `<table><thead><tr>${d.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${d.table.rows
            .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>${d.table.note ? `<p>${esc(d.table.note)}</p>` : ''}`
        : '',
      li(d.points ?? []),
    ].join(''),
  )
  return [
    `<article><h3>${esc(p.name)} — ${esc(p.kind)}</h3>`,
    `<p><strong>${esc(p.statement)}</strong></p>`,
    ...[p.summary, p.context, ...p.overview, p.why].filter(Boolean).map((t) => `<p>${esc(t as string)}</p>`),
    li(p.built),
    li(p.results.map((r) => `${r.value} ${r.label}`)),
    ...deep,
    p.topics.length ? `<p>Stack: ${esc(p.topics.join(', '))}</p>` : '',
    links.length ? `<p>${links.join(' · ')}</p>` : '',
    '</article>',
  ].join('')
}

/**
 * The page as plain HTML, placed inside #root at build time. Crawlers that do
 * not run JavaScript (most AI crawlers, link unfurlers) read this; so does a
 * visitor with scripts off. React replaces it the moment the app mounts.
 */
export function staticHtml() {
  return [
    '<main class="prerender">',
    `<header><h1>${esc(person.name)}</h1><p>${esc(roles)} — ${esc(person.location)}</p><p>${esc(person.heroSub)}</p>`,
    `<p>${person.heroProof.map((f) => esc(`${f.value} ${f.label}`)).join(' · ')}</p></header>`,

    `<section><h2>About</h2><p>${esc(person.aboutLead)}</p>${person.about.map((p) => `<p>${esc(p)}</p>`).join('')}`,
    li(person.aboutFacts.map((f) => `${f.label}: ${f.value}`)),
    '</section>',

    `<section><h2>Currently building</h2>${li(now.items.map((i) => `${i.name}: ${i.line}`))}</section>`,

    `<section><h2>Featured work</h2>${featured.map(projectHtml).join('')}</section>`,
    `<section><h2>More work</h2>${archive.map(projectHtml).join('')}</section>`,

    '<section><h2>Experience</h2>',
    ...experience.map(
      (r) =>
        `<article><h3>${esc(r.title)}, ${esc(r.company)}</h3><p>${esc([r.site, r.period, r.location].filter(Boolean).join(' · '))}</p>${li(r.bullets)}</article>`,
    ),
    '</section>',

    '<section><h2>Track record</h2>',
    li([
      `${trackRecord.role.value}, ${trackRecord.role.label}`,
      ...trackRecord.stats.map((s) => `${s.value}${s.suffix} ${s.label}`),
      ...trackRecord.highlights.map((h) => `${h.title} — ${h.result} (${h.detail})`),
      ...trackRecord.also,
    ]),
    '</section>',

    `<section><h2>Outside the terminal</h2>${li(outside.map((o) => (o.note ? `${o.label}: ${o.note}` : o.label)))}</section>`,

    `<section><h2>Contact</h2><p>Open to ${esc(person.openTo.join(', ').toLowerCase())}.</p>`,
    `<p><a href="mailto:${esc(person.email)}">${esc(person.email)}</a> · <a href="${esc(person.github.url)}">GitHub</a> · <a href="${esc(person.linkedin.url)}">LinkedIn</a> · <a href="${esc(person.resumePdf)}">Résumé (PDF)</a></p></section>`,
    '</main>',
  ].join('\n')
}

/** everyone is welcome, AI crawlers by name so there is no doubt */
export function robotsTxt() {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Bingbot']
  return ['User-agent: *', 'Allow: /', '', ...bots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']), `Sitemap: ${abs('/sitemap.xml')}`, ''].join('\n')
}

export function sitemapXml(today: string) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${abs('/')}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    '</urlset>',
    '',
  ].join('\n')
}

/** llms.txt: the same page as short markdown, for language models that ask for it */
export function llmsTxt() {
  const project = (p: Project) => {
    const link = p.links.live || p.links.repo
    const name = link ? `[${p.name}](${link})` : p.name
    return `- ${name}: ${p.kind}. ${p.statement}${p.summary ? ' ' + p.summary : ''}`
  }
  return [
    `# ${person.name}`,
    '',
    `> ${site.description}`,
    '',
    `${person.name} is an ${roles.replace(/, ([^,]*)$/, ' and $1')} based in ${person.location}. In his own words: "${person.about.join(' ')}"`,
    '',
    '## Roles',
    ...experience.map((r) => `- ${r.title}, ${r.company}${r.site ? ` (${r.site})` : ''}${r.period ? `, ${r.period}` : ''}: ${r.bullets.join(' ')}`),
    '',
    '## Featured work',
    ...featured.map(project),
    '',
    '## More work',
    ...archive.map(project),
    '',
    '## Track record',
    ...trackRecord.stats.map((s) => `- ${s.value}${s.suffix} ${s.label}`),
    ...trackRecord.highlights.map((h) => `- ${h.title}: ${h.result} (${h.detail})`),
    ...trackRecord.also.map((a) => `- ${a}`),
    '',
    '## Contact',
    `- Website: ${abs('/')}`,
    `- Email: ${person.email}`,
    `- GitHub: ${person.github.url}`,
    `- LinkedIn: ${person.linkedin.url}`,
    `- Résumé: ${abs(person.resumePdf)}`,
    '',
  ].join('\n')
}
