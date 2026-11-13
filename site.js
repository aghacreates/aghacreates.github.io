'use strict';

const gallery = document.querySelector('.project-grid');
const tiles = document.querySelector('.hero-tiles');
const filters = document.querySelector('.filters');
const count = document.querySelector('.project-count');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function artwork(project, className, eager = false) {
  const wrapper = element('div', `artwork ${className}`);
  const label = element('span', 'artwork-label', project.title);
  label.setAttribute('aria-hidden', 'true');
  wrapper.append(label);

  const source = project.cover || project.fallback;
  if (source) {
    const image = element('img');
    image.alt = '';
    image.loading = eager ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      if (project.fallback && image.getAttribute('src') !== project.fallback) {
        image.src = project.fallback;
      } else {
        image.remove();
        label.hidden = false;
      }
    });
    label.hidden = true;
    wrapper.append(image);
    image.src = source;
  }

  return wrapper;
}

function projectLink(project, className) {
  const link = element('a', className);
  link.href = projectHref(project);
  return link;
}

const cards = portfolioProjects.map(project => {
  const card = projectLink(project, 'project-card');
  const caption = element('div', 'card-caption');
  const names = element('div');
  names.append(element('h3', null, project.title), element('p', null, project.subtitle || project.category));
  const arrow = element('span', 'card-arrow', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  caption.append(names, arrow);
  card.append(artwork(project, 'card-artwork'), caption);
  return card;
});
cards.forEach((card, index) => { card.style.viewTransitionName = `card-${index}`; });
gallery.append(...cards);

for (const project of portfolioProjects.filter(project => project.featured)) {
  const tile = projectLink(project, `tile tile-${project.featured}`);
  tile.setAttribute('aria-label', `View ${project.title}`);
  tile.append(artwork(project, 'tile-artwork', true));
  tiles.append(tile);
}

const cardCategories = portfolioProjects.map(project => [project.category, ...(project.additionalCategories || [])]);
const categories = [...new Set(cardCategories.flat())].sort();
const filterButtons = ['All work', ...categories].map(category => {
  const button = element('button', null, category);
  button.type = 'button';
  button.addEventListener('click', () => {
    // Cards glide to their new places when the browser supports view transitions.
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !calm) document.startViewTransition(() => applyFilter(category));
    else applyFilter(category);
  });
  return button;
});
filters.append(...filterButtons);
document.querySelector('.work-controls').hidden = false;

function applyFilter(category) {
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.textContent === category)));
  let shown = 0;
  cards.forEach((card, index) => {
    card.hidden = category !== 'All work' && !cardCategories[index].includes(category);
    if (!card.hidden) shown++;
  });
  count.textContent = `${shown} ${shown === 1 ? 'project' : 'projects'}`;
}
applyFilter('All work');

function redirectProjectHash() {
  const id = location.hash.match(/^#project-(\d+)$/)?.[1];
  const project = id && portfolioProjects.find(entry => projectId(entry) === id);
  if (project) location.replace(projectHref(project));
}
window.addEventListener('hashchange', redirectProjectHash);
redirectProjectHash();
