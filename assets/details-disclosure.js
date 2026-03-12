class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

function isMegaMenuDebug() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug_mega') === '1';
}

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.hoverCloseTimeout = null;

    if (this.mainDetailsToggle && this.mainDetailsToggle.classList.contains('mega-menu')) {
      this.addEventListener('mouseenter', this.onHoverEnter.bind(this));
      this.addEventListener('mouseleave', this.onHoverLeave.bind(this));
      // Keep mega open when hovering the dropdown panel (it's positioned outside the details box)
      if (this.content) {
        this.content.addEventListener('mouseenter', this.onHoverEnter.bind(this));
        this.content.addEventListener('mouseleave', this.onHoverLeave.bind(this));
      }
      // Hover-only mega: prevent summary click from toggling when clicking the title (so link works)
      if (this.mainDetailsToggle.classList.contains('mega-menu--hover-only')) {
        const summary = this.mainDetailsToggle.querySelector('summary');
        if (summary) summary.addEventListener('click', (e) => { if (!e.target.closest('a')) e.preventDefault(); });
      }
    }
  }

  close() {
    if (isMegaMenuDebug() && this.mainDetailsToggle && this.mainDetailsToggle.classList.contains('mega-menu')) {
      return;
    }
    super.close();
  }

  open() {
    this.mainDetailsToggle.setAttribute('open', '');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', true);
  }

  onHoverEnter() {
    if (this.hoverCloseTimeout) {
      clearTimeout(this.hoverCloseTimeout);
      this.hoverCloseTimeout = null;
    }
    this.open();
  }

  onHoverLeave() {
    if (isMegaMenuDebug()) return;
    const self = this;
    this.hoverCloseTimeout = setTimeout(function() {
      self.close();
      self.hoverCloseTimeout = null;
    }, 150);
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);
