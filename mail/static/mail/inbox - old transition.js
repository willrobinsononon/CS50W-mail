// amin: will
// email: will@robinson.com
// password:  will

// w@wr.com
// sn@il.co.uk

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // send email
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //fetch emails
  fetch(`emails/${ mailbox }`)
    .then( response => response.json())
    .then( data => data.forEach( (data) => add_email(data, mailbox)) );
}

function add_email(email_data, mailbox) {

  //make first column recipients (sent) or sender (inbox/archive)
  if (mailbox === 'sent') {
    column1 = email_data.recipients;
  }
  else {
    column1 = email_data.sender;
  }

  //create email div
  const email = document.createElement('div');
  email.className = 'email';
  email.id = `email${email_data.id}`
  email.dataset.open = 'false';

  //create emailHead div within email div 
  email.innerHTML = `<div class="emailHead"><div class="emailCol">${column1}</div><div class="subjectCol">${email_data.subject}</div><div class="timeCol">${email_data.timestamp}</div></div>`;
  if (email_data.read === true) {
    email.classList.add('read');
  }

  //add email div to emails_view
  document.querySelector('#emails-view').append(email);

  //add event listener to emailHead to open reader on click
  document.querySelector(`#email${email_data.id} > .emailHead`).addEventListener('click', email_click);
}

function send_email() {

  // read data from form
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  //ad html line breaks to body
  const body = document.querySelector('#compose-body').value.replace(/(?:\r\n|\r|\n)/g, '<br>');

  //send email data to API
  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {console.log(result)});

  //load sent mailbox
  load_mailbox('sent');

  return false;
}

function email_click() {

  // get email id
  id = parseInt(event.currentTarget.closest('.email').id.slice(5));

  // select email div
  email_div = document.querySelector(`#email${id}`);

  // check if reader is open, if not open reader
  if (email_div.dataset.open === 'true') {
    close_email(id);

  } else {
    //close any other open reader
    document.querySelectorAll('[data-open="true"]').forEach( (self) => close_email(parseInt(self.id.slice(5))));
    open_email(id);
  }
}

function open_email(id) {

  //set email to read via API
  fetch(`emails/${ id }`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  //change current email class to read (since will not reload from API) - changes background colour
  document.querySelector(`#email${ id }`).classList.add('read');

  //get email data and open with event handler
  fetch(`emails/${ id }`)
    .then( response => response.json())
    .then( data => add_email_reader(data) );
}

function add_email_reader(email_to_read) {

  //remove event listener for duration of transition
  document.querySelector(`#email${email_to_read.id} > .emailHead`).removeEventListener('click', email_click);

  //create reader div
  const reader = document.createElement('div');

  //set class name to show (trigger animation)
  reader.className = 'reader-view show';
  reader.innerHTML = `${email_to_read.body}`;

  //select email div and add reader to bottom
  document.querySelector(`#email${ email_to_read.id }`).append(reader)

  //event listener for end of animation to readd event listener
  reader.addEventListener('animationend', () => {
    document.querySelector(`#email${email_to_read.id} > .emailHead`).addEventListener('click', email_click);
  })

  //set email div open status to true
  document.querySelector(`#email${email_to_read.id}`).dataset.open = 'true';
}

function close_email(id) {

  //remove event listener for duration of animation
  document.querySelector(`#email${id} > .emailHead`).removeEventListener('click', email_click);

  //select reader to be removed
  const body = document.querySelector(`#email${ id } > .reader-view`);

  //change class name to hide (trigger animation)
  body.className = 'reader-view hide';

  //event listener for end of animation to readd event listener
  body.addEventListener('animationend', () => {
    body.remove();
    document.querySelector(`#email${id} > .emailHead`).addEventListener('click', email_click);
  })

  //set email div open status to false
  document.querySelector(`#email${id}`).dataset.open = 'false';
}