import { select, templates, classNames } from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(homePage) {
    const thisHome = this;

    thisHome.render(homePage);
    thisHome.bannerClick();
  }

  render(homePage) {
    const thisHome = this;

    thisHome.dom = {};
    thisHome.dom.wrapper = homePage;

    const generatedHTML = templates.mainPage();
    // console.log({generatedHTML});
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    // console.log({generatedDOM});

    thisHome.dom.wrapper.appendChild(generatedDOM);
  }

  bannerClick() {
    const thisHome = this;

    thisHome.dom.banner = document.querySelectorAll(select.banner.links);
    console.log('thisHome.dom.banner', thisHome.dom.banner);
    thisHome.pages = document.querySelectorAll(select.containerOf.pages);
    thisHome.bannerWrapper = document.querySelector(select.banner.bannerWrapper);
    thisHome.activePage = document.querySelector(select.containerOf.pages).children;
    thisHome.navLinks = document.querySelectorAll(select.nav.links);

    console.log('thisHome.activePage', thisHome.activePage);
    thisHome.bannerWrapper.addEventListener('click', function (event) {

      const idFromHash = event.target.offsetParent.children[0].hash.replace('#/', '');
      const idHash = event.target.offsetParent.children[0].hash.replace('/', '');

      if (event.target.classList.contains(select.banner.bannerOrder)) {

        for (let page of thisHome.activePage) {
          console.log('page', page);
          page.classList.remove(classNames.pages.active);
          console.log('page.id', page.id);
          console.log('idFromHash', idFromHash);

          if (page.id == idFromHash) {

            page.classList.add(classNames.pages.active);
          }
        }

        for (let link of thisHome.navLinks) {
          link.classList.remove(classNames.nav.active);
          const idLinks = link.getAttribute('href');
          console.log('idHash', idHash);
          console.log('idLinks', idLinks);
          if (idLinks == idHash) {
            link.classList.add(classNames.nav.active);
          }
        }
      }
    });
  }
}

export default Home;