const { timeline, listen } = popmotion;

const cancelModalButton = document.querySelector('.modal-cancel');
const okModalButton = document.querySelector('.modal-ok');
const modalHeader = document.querySelector('#modalHeader');
const modalMessage = document.querySelector('#modalMessage');
const modalImg = Array.from(document.getElementsByClassName('image-btn'));
const modalShade = styler(document.querySelector('.modal-shade'));
const modalContainer = styler(document.querySelector('.modal-container'));
const modal = styler(document.querySelector('.modal'));
const modalSections = Array.from(document.querySelector('.modal').children).map(styler);
const sectionLabels = modalSections.map((s, i) => 'section' + i);

const tweenUp = (track, duration = 500, yFrom = 100) => ({
  track,
  duration,
  from: { y: yFrom, opacity: 0 },
  to: { y: 0, opacity: 1 },
  ease: { y: easing.backOut, opacity: easing.linear }
});

const setStylers = (v) => {
  if (v.shade !== undefined) modalShade.set('opacity', v.shade);
  if (v.modal !== undefined) modal.set(v.modal);
  sectionLabels.forEach((label, i) => {
    if (v[label] !== undefined) modalSections[i].set(v[label])
  });
};

const showContainers = () => {
  modalShade.set('display', 'block');
  modalContainer.set('display', 'flex');
};

const hideContainers = () => {
  modalShade.set('display', 'none');
  modalContainer.set('display', 'none');
};

const openModal = (title, message, two, okay_text='Ok', cancel_text='Cancel', showImg) => {
  showContainers();
  modalHeader.innerHTML = title;
  modalMessage.innerHTML = message;
  okModalButton.innerHTML = okay_text;
  if(two) {
    cancelModalButton.style.visibility = "visible";
    cancelModalButton.innerHTML = cancel_text;
  }else{
    cancelModalButton.style.visibility = "hidden";
  }

  if(showImg){
    modalImg.forEach((i) => i.style.display='block');
  }else{
    modalImg.forEach((i) => i.style.display='none');
  }

  timeline([
    { track: 'shade', from: 0, to: 1, ease: easing.linear },
    '-100',
    tweenUp('modal'),
    '-200',
    [...modalSections.map((s, i) => tweenUp(sectionLabels[i], 300, 50)), 50]
  ]).start(setStylers);
}

const cancelModal = () => {
  timeline([
    {
      track: 'modal',
      duration: 200,
      from: { y: 0, opacity: 1 },
      to: { y: 100, opacity: 0 },
      ease: { y: easing.easeIn, opacity: easing.linear }
    },
    '-100',
    { track: 'shade', from: 1, to: 0, ease: easing.linear, duration: 200 }
  ]).start({
    update: setStylers,
    complete: hideContainers
  });
}

const okModal = () => {
  timeline([
    {
      track: 'modal',
      duration: 200,
      from: { y: 0, opacity: 1 },
      to: { y: -200, opacity: 0 },
      ease: { y: easing.easeOut, opacity: easing.linear }
    },
    '-100',
    { track: 'shade', from: 1, to: 0, ease: easing.linear, duration: 300 }
  ]).start({
    update: setStylers,
    complete: hideContainers
  });
}

listen(cancelModalButton, 'click').start(cancelModal);
listen(okModalButton, 'click').start(okModal);
