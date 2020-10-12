const dtf = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' });

module.exports = {
  formattedDate: (data) => dtf.format(data.page.date),
};
