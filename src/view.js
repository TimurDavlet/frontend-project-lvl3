/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import validate from './validation.js';
import parser from './parser.js';

const routes = {
  allOrigins: (url) => {
    const result = new URL('/get', 'https://allorigins.hexlet.app');
    result.searchParams.set('url', url);
    result.searchParams.set('disableCache', 'true');
    return result.toString();
  },
};

const makeRequest = (i18n, link) => axios.get(routes.allOrigins(link))
  // eslint-disable-next-line no-unused-vars
  .then((response) => response.data).catch((e) => {
    throw new Error(i18n.t('errors.network'));
  });

const getNewPost = (state, i18n) => {
  state.links.forEach((link) => makeRequest(i18n, link)
    .then((data) => {
      const newFeed = parser(data.contents, state.feedback, i18n);
      if (newFeed !== null) {
        const newPosts = _.differenceBy(newFeed.feedItems, state.posts, 'postLink');
        if (newPosts.length > 0) {
          state.newPosts = [...newPosts];
          state.posts = [...state.newPosts, ...state.posts];
        }
      }
    }));
  setTimeout(() => getNewPost(state, i18n), 5000);
};

const getFeeds = (state, i18n, link) => makeRequest(i18n, link)
  .then((data) => {
    const response = data;
    return response;
  })
  .then((data2) => {
    const newFeed = parser(data2.contents, state.feedback, i18n);
    if (newFeed !== null) {
      state.newFeed = [newFeed];
      state.feeds = [...state.newFeed, ...state.feeds];
      state.links.push(link);
      const newPosts = _.differenceBy(newFeed.feedItems, state.posts, 'postLink');
      if (newPosts.length > 0) {
        state.newPosts = [...newPosts];
        state.posts = [...state.newPosts, ...state.posts];
      }
      state.feedback.success = i18n.t('success');
    }
    state.input.readonly = false;
  });

const runValidation = (state, i18n, link) => {
  state.feedback.success = null;
  state.feedback.error = null;
  state.input.readonly = true;
  validate(link, state.links, i18n)
    .then(() => getFeeds(state, i18n, link))
    .then(() => getNewPost(state, i18n))
    .catch((err) => {
      state.feedback.error = err.message;
      state.feedback.success = null;
      state.input.readonly = false;
    });
};

const view = (elements, state, i18n) => {
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    return runValidation(state, i18n, elements.input.value);
  });
};

export default view;
