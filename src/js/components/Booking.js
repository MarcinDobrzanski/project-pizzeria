import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.reservationTables = [];

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    // console.log('params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };


    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log('bookings', bookings);
        // console.log('eventsCurrent', eventsCurrent);
        // console.log('eventsRepeat', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (typeof thisBooking.booked[thisBooking.date] == 'undefined' || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      // console.log('table', table);
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked, classNames.booking.reservation);
        const removeReservation = thisBooking.reservationTables.indexOf(tableId);
        // console.log('removeReservation', removeReservation);
        // console.log('reservationTables', thisBooking.reservationTables);
        thisBooking.reservationTables.splice(removeReservation, 1);

      }
    }

  }

  render(element) {
    const thisBooking = this;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;


    const generatedHTML = templates.bookingWidget();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisBooking.dom.wrapper.appendChild(generatedDOM);

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.hourReservation = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.output);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.reservationTable = thisBooking.dom.wrapper.querySelector(select.booking.reservationTable);
    thisBooking.dom.input = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisBooking.dom.submitBooking = thisBooking.dom.wrapper.querySelector(select.booking.submit);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.durationReservation = thisBooking.dom.wrapper.querySelector(select.booking.hours);
    thisBooking.dom.peopleReservation = thisBooking.dom.wrapper.querySelector(select.booking.people);
    thisBooking.dom.startersReservation = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);

  }

  initWidgets() {
    const thisBooking = this;


    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.form.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });


    thisBooking.dom.reservationTable.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.initTables(event);
    });

    thisBooking.dom.submitBooking.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  initTables(event) {
    const thisBooking = this;


    const removeReservation = thisBooking.reservationTables.indexOf(event.target.value);

    if (event.target.classList.contains('table') && event.target.classList.contains('booked')) {
      alert('Stolik jest zajęty!');

    } else if (event.target.classList.contains('table') && event.target.classList.contains(classNames.booking.reservation)) {
      event.target.classList.remove(classNames.booking.reservation);
      thisBooking.reservationTables.splice(removeReservation, 1);

    } else if (event.target.classList.contains('table') && event.target.classList.contains('table')) {

      for (let table of thisBooking.dom.tables) {
        if (table.classList.contains(classNames.booking.reservation)) {
          table.classList.remove(classNames.booking.reservation);
          thisBooking.reservationTables.splice(removeReservation, 1);
        }
      }


      event.target.classList.add(classNames.booking.reservation);
      thisBooking.reservationTables.push(event.target.attributes[1].value);
    }

    // console.log('thisBooking.reservationTables', thisBooking.reservationTables);

  }

  sendBooking() {
    const thisBooking = this;
    // console.log('sendBooking thisBooking', thisBooking);

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      starters: [],
    };

    payload.date = thisBooking.date;
    payload.hour = thisBooking.dom.hourReservation.innerText;
    payload.table = parseInt(thisBooking.reservationTables[0]);
    payload.duration = parseInt(thisBooking.dom.durationReservation.value);
    payload.ppl = parseInt(thisBooking.dom.peopleReservation.value);
    payload.phone = thisBooking.dom.phone.value;
    payload.address = thisBooking.dom.address.value;

    for (let starter of thisBooking.dom.startersReservation) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);

    const startHour = utils.hourToNumber(payload.hour);

    for (let hourBlock = startHour; hourBlock < startHour + payload.duration; hourBlock += 0.5) {

      thisBooking.booked[payload.date][hourBlock].push(payload.table);
    }

    for (let table of thisBooking.dom.tables) {
      if (table.classList.contains(classNames.booking.reservation)) {
        table.classList.remove(classNames.booking.reservation);
        table.classList.add(classNames.booking.tableBooked);
      }
    }

    // console.log('payload booking', payload);
    // console.log('thisBooking.booked', thisBooking.booked);
  }
}

export default Booking;



