'use strict';

const id = new URLSearchParams(location.search).get('id');
const projectIndex = portfolioProjects.findIndex(project => projectId(project) === id);

function createPanel(src, width, height, project, index) {
  const figure = document.createElement('figure');
  const image = document.createElement('img');
  image.alt = `${project.title} — panel ${index + 1}`;
  image.loading = index === 0 ? 'eager' : 'lazy';
  image.decoding = 'async';
  if (width && height) {
    image.width = width;
    image.height = height;
  }
  image.addEventListener('error', () => {
    const source = document.createElement('a');
    source.className = 'text-link';
    source.href = project.behance;
    source.target = '_blank';
    source.rel = 'noopener';
    source.textContent = `View panel ${index + 1} on Behance ↗`;
    figure.replaceChildren(source);
  }, { once: true });
  image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
  figure.append(image);
  image.src = src;
  return figure;
}

function createMotion([src, width, height], type, project, number, permalink) {
  const section = document.createElement('div');
  section.className = 'case-motion';
  section.style.aspectRatio = `${width || 16} / ${height || 9}`;

  if (type === 'video') {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.setAttribute('aria-label', `${project.title} — motion clip ${number}`);
    video.src = src;
    section.append(video);
  } else {
    const play = document.createElement('button');
    play.className = 'button button-lime';
    play.type = 'button';
    play.textContent = `Load motion clip ${number} ▷`;
    play.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.title = `${project.title} — motion clip ${number}`;
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true;
      frame.src = src;
      section.replaceChildren(frame);
      frame.focus();
    }, { once: true });
    section.append(play);
  }

  return section;
}

function showProject(project) {
  document.title = `${project.title} — Agha Noman`;
  document.querySelector('#project-title').textContent = project.title;
  document.querySelector('.case-category').textContent = project.subtitle || project.category;
  const description = document.querySelector('.case-description');
  description.textContent = project.description || '';
  description.hidden = !project.description;
  document.querySelector('.case-source').href = project.behance;
  const gallery = document.querySelector('.case-gallery');
  let imageIndex = 0;
  let motionIndex = 0;

  for (const block of caseStudies[id] || []) {
    if (block.text) {
      const paragraph = document.createElement('p');
      paragraph.className = 'case-text';
      paragraph.textContent = block.text;
      gallery.append(paragraph);
    } else if (block.images) {
      const row = document.createElement('div');
      row.className = block.images.length === 1 ? 'case-row' : 'case-row case-row-grid';
      row.style.setProperty('--columns', block.images.length);
      for (const [src, width, height] of block.images) row.append(createPanel(src, width, height, project, imageIndex++));
      gallery.append(row);
    } else if (block.motion) {
      gallery.append(createMotion(block.motion, block.type, project, ++motionIndex, block.permalink));
    }
  }
  gallery.hidden = !gallery.hasChildNodes();

  const nextProject = portfolioProjects[(projectIndex + 1) % portfolioProjects.length];
  const next = document.querySelector('.next-case');
  next.href = projectHref(nextProject);
  next.textContent = `Next project · ${nextProject.title} →`;
  document.querySelector('article').hidden = false;
}

if (projectIndex >= 0) showProject(portfolioProjects[projectIndex]);
else document.querySelector('.case-missing').hidden = false;
