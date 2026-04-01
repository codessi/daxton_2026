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

class HeaderMenu extends HTMLElement {
  connectedCallback() {
    if (!isMegaMenuDebug() || this._megaDebugAutoOpened) return;
    const disclosure = this.querySelector('.header__disclosure.mega-menu');
    if (!disclosure) return;
    const firstMegaInHeader = document.querySelector(
      '.section-header header .header__disclosure.mega-menu, header.header .header__disclosure.mega-menu, header .header__disclosure.mega-menu'
    );
    if (!firstMegaInHeader || disclosure !== firstMegaInHeader) return;
    this._megaDebugAutoOpened = true;
    setTimeout(() => this.open(), 0);
  }

  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.hoverCloseTimeout = null;
    this.mainDetailsToggle = this.querySelector('details');
    this.useButtonTrigger = this.querySelector('.header__disclosure');

    if (this.mainDetailsToggle) {
      this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;
      this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
      this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
      if (this.mainDetailsToggle.classList.contains('mega-menu')) {
        this.addEventListener('mouseenter', this.onHoverEnter.bind(this));
        this.addEventListener('mouseleave', this.onHoverLeave.bind(this));
        if (this.content) {
          this.content.addEventListener('mouseenter', this.onHoverEnter.bind(this));
          this.content.addEventListener('mouseleave', this.onHoverLeave.bind(this));
        }
        if (this.mainDetailsToggle.classList.contains('mega-menu--hover-only')) {
          const summary = this.mainDetailsToggle.querySelector('summary');
          if (summary) summary.addEventListener('click', (e) => { if (!e.target.closest('a')) e.preventDefault(); });
        }
      }
    } else if (this.useButtonTrigger) {
      this.trigger = this.useButtonTrigger.querySelector('button[aria-controls]');
      this.content = this.trigger ? document.getElementById(this.trigger.getAttribute('aria-controls')) : null;
      if (this.trigger && this.content) {
        this.trigger.addEventListener('click', this.onButtonToggle.bind(this));
        this.useButtonTrigger.addEventListener('focusout', this.onFocusOut.bind(this));
        this.initNestedDisclosures(this.content);
      }
      if (this.useButtonTrigger.classList.contains('mega-menu')) {
        this.addEventListener('mouseenter', this.onHoverEnter.bind(this));
        this.addEventListener('mouseleave', this.onHoverLeave.bind(this));
        if (this.content) {
          this.content.addEventListener('mouseenter', this.onHoverEnter.bind(this));
          this.content.addEventListener('mouseleave', this.onHoverLeave.bind(this));
        }
        this.addEventListener('focusin', this.onMegaFocusIn.bind(this));
      }
    }
  }

  onMegaFocusIn() {
    if (!this.useButtonTrigger || !this.useButtonTrigger.classList.contains('mega-menu')) return;
    if (this.hoverCloseTimeout) {
      clearTimeout(this.hoverCloseTimeout);
      this.hoverCloseTimeout = null;
    }
    this.open();
  }

  initNestedDisclosures(container) {
    if (!container) return;
    container.querySelectorAll('.header__disclosure--nested').forEach((el) => {
      const btn = el.querySelector('button[aria-controls]');
      const panel = btn ? document.getElementById(btn.getAttribute('aria-controls')) : null;
      if (btn && panel) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const open = panel.hidden;
          panel.hidden = !open;
          btn.setAttribute('aria-expanded', open);
        });
        el.addEventListener('focusout', (e) => {
          setTimeout(() => { if (!el.contains(document.activeElement)) { panel.hidden = true; btn.setAttribute('aria-expanded', false); } });
        });
      }
    });
  }

  onButtonToggle() {
    if (!this.trigger || !this.content) return;
    if (this.useButtonTrigger && this.useButtonTrigger.classList.contains('mega-menu--hover-only')) {
      return;
    }
    const open = this.content.hidden;
    this.content.hidden = !open;
    this.trigger.setAttribute('aria-expanded', open);
    if (this.header && open) {
      document.documentElement.style.setProperty(
        '--header-bottom-position-desktop',
        `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
      );
    }
  }

  onFocusOut() {
    if (
      isMegaMenuDebug() &&
      ((this.mainDetailsToggle && this.mainDetailsToggle.classList.contains('mega-menu')) ||
        (this.useButtonTrigger && this.useButtonTrigger.classList.contains('mega-menu')))
    ) {
      return;
    }
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (this.mainDetailsToggle && this.header) {
      this.header.preventHide = this.mainDetailsToggle.open;
    }
    if (!this.header || !document.documentElement.style.getPropertyValue('--header-bottom-position-desktop')) return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }

  close() {
    if (
      isMegaMenuDebug() &&
      ((this.mainDetailsToggle && this.mainDetailsToggle.classList.contains('mega-menu')) ||
        (this.useButtonTrigger && this.useButtonTrigger.classList.contains('mega-menu')))
    ) {
      return;
    }
    if (this.mainDetailsToggle) {
      this.mainDetailsToggle.removeAttribute('open');
      const summary = this.mainDetailsToggle.querySelector('summary');
      if (summary) summary.setAttribute('aria-expanded', false);
    } else if (this.trigger && this.content) {
      this.content.hidden = true;
      this.trigger.setAttribute('aria-expanded', false);
      if (this.useButtonTrigger) {
        this.useButtonTrigger.classList.remove('mega-menu--open');
      }
      if (this.header && this.useButtonTrigger && this.useButtonTrigger.classList.contains('mega-menu')) {
        this.header.preventHide = false;
      }
    }
  }

  open() {
    if (this.mainDetailsToggle) {
      this.mainDetailsToggle.setAttribute('open', '');
      const summary = this.mainDetailsToggle.querySelector('summary');
      if (summary) summary.setAttribute('aria-expanded', true);
    } else if (this.trigger && this.content) {
      this.content.hidden = false;
      this.trigger.setAttribute('aria-expanded', true);
      if (this.useButtonTrigger) {
        this.useButtonTrigger.classList.add('mega-menu--open');
      }
      if (this.header && this.useButtonTrigger && this.useButtonTrigger.classList.contains('mega-menu')) {
        document.documentElement.style.setProperty(
          '--header-bottom-position-desktop',
          `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
        );
        this.header.preventHide = true;
      }
    }
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
}

customElements.define('header-menu', HeaderMenu);
