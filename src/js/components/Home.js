import { templates } from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(homePage) {
    const thisHome = this;

    thisHome.render(homePage);
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
}

export default Home;