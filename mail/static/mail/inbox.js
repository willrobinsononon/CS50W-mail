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
  document.querySelector('#form-error').value = '';
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

function add_email(email, mailbox) {

  //make first column recipients (sent) or sender (inbox/archive)
  if (mailbox === 'sent') {
    column1 = email.recipients;
  }
  else {
    column1 = email.sender;
  }

  //create email div
  const emailDiv = document.createElement('div');
  emailDiv.className = 'email';
  emailDiv.dataset.emailid = email.id;
  emailDiv.dataset.open = 'false';

  //create other elements
  const emailHead = document.createElement('div');
  emailHead.className = 'emailHead';

  const emailCol = document.createElement('div');
  emailCol.className = 'emailCol';
  emailCol.innerHTML = column1;

  const subjectCol = document.createElement('div');
  subjectCol.className = 'subjectCol';
  subjectCol.innerHTML = email.subject;

  const timeCol = document.createElement('div');
  timeCol.className = 'timeCol';
  timeCol.innerHTML = email.timestamp;

  //nest elements
  emailHead.appendChild(emailCol);
  emailHead.appendChild(subjectCol);
  emailHead.appendChild(timeCol);
  emailDiv.appendChild(emailHead);


  //create emailHead div within email div 
  //emailDiv.innerHTML = `<div class="emailHead"><div class="emailCol">${column1}</div><div class="subjectCol">${email.subject}</div><div class="timeCol">${email.timestamp}</div></div>`;
  
  //if email is read set class for styling
  if (email.read === true) {
    emailDiv.classList.add('read');
  }

  //add email div to emails_view
  document.querySelector('#emails-view').append(emailDiv);

  //add event listener to emailHead to open reader on click
  emailHead.addEventListener('click', email_click);
}

function send_email() {

  // read data from form
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  if (recipients === '') {
    document.querySelector('#form-error').innerHTML = 'Recipients cannot be blank';
    return false
  }
  else if (subject === '') {
    document.querySelector('#form-error').innerHTML = 'Subject cannot be blank';
    return false
  }


  //send email data to API
  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => { if (response.status === 400) {
    response.json().then(result => {
      console.log(result)
      document.querySelector('#form-error').innerHTML = result.error;
    });
   }
   else {
    load_mailbox('sent');
   }
  });

  return false;
}

function email_click() {

  // select email div
  emailDiv = event.currentTarget.closest('.email');

  // get email id
  id = parseInt(emailDiv.dataset.emailid);

  // check if reader is open, if not open reader
  if (emailDiv.dataset.open === 'true') {
    close_email(id);

  } else {
    //close any other open reader
    document.querySelectorAll('[data-open="true"]').forEach( (self) => close_email(parseInt(self.dataset.emailid)));
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
  document.querySelector(`[data-emailid="${id}"]`).classList.add('read');

  //get email data and open with event handler
  fetch(`emails/${ id }`)
    .then( response => response.json())
    .then( data => add_email_reader(data) );
}

function add_email_reader(email_to_read) {

  //store email elements
  const emailDiv = document.querySelector(`[data-emailid="${email_to_read.id}"]`);
  const emailHead = emailDiv.querySelector('.emailHead');

  //remove event listener for duration of animation
  emailHead.removeEventListener('click', email_click);

  //create reader div
  const reader = document.createElement('div');

  //set class name to show (trigger animation)
  reader.classList.add('reader-view', 'show', 'unselectable');

  //add generic email header
  reader.innerHTML = `<strong>Sender: </strong>${email_to_read.sender}<br><strong>Recipients: </strong>${email_to_read.recipients}<br><strong>Subject: </strong>${email_to_read.subject}<br><strong>Time: </strong>${email_to_read.timestamp}<br>`;
  
  //add buttons and body depending on mailbox

  mailbox = document.querySelector('#emails-view > h3').innerHTML;

  const replyButton = document.createElement('button');
  replyButton.classList.add('btn', 'btn-sm', 'btn-outline-primary');
  replyButton.dataset.emailid = `${email_to_read.id}`;
  replyButton.dataset.action = 'reply';
  replyButton.disabled = true;
  replyButton.innerHTML = 'Reply';

  reader.appendChild(replyButton);
  reader.append('\n');

  if ( mailbox === 'Inbox' ) {
    const archiveButton = document.createElement('button');
    archiveButton.classList.add('btn', 'btn-sm', 'btn-outline-primary');
    archiveButton.dataset.emailid = `${email_to_read.id}`;
    archiveButton.dataset.action = 'archive';
    archiveButton.disabled = true;
    archiveButton.innerHTML = 'Archive';
    
    reader.appendChild(archiveButton)
  } else if ( mailbox === 'Archive') {
    const unarchiveButton = document.createElement('button');
    unarchiveButton.classList.add('btn', 'btn-sm', 'btn-outline-primary');
    unarchiveButton.dataset.emailid = `${email_to_read.id}`;
    unarchiveButton.dataset.action = 'unarchive';
    unarchiveButton.disabled = true;
    unarchiveButton.innerHTML = 'Unrchive';
    
    reader.appendChild(unarchiveButton);
  }

  const hr = document.createElement('hr');
  reader.appendChild(hr);
  reader.innerHTML += email_to_read.body.replace(/(?:\r\n|\r|\n)/g, '<br>');
  
  //select email div and add reader to bottom
  emailDiv.append(reader);

  //hr transition
  hr.className = 'hrShow';

  //buttons transition
  const buttons = emailDiv.querySelectorAll('button');
  buttons.forEach( (button) => button.classList.add('btnShow'));
  

  //event listener for end of animation to readd event listener
  reader.addEventListener('animationend', () => {
    emailHead.addEventListener('click', email_click);
    buttons.forEach( (button) => {
      button.addEventListener('click', button_click);
      button.disabled = false;
      });
    reader.classList.remove('unselectable');
  }, {once: true})

  //set email div open status to true
  emailDiv.dataset.open = 'true';
}

function close_email(id) {

  //store email elements
  const emailDiv = document.querySelector(`[data-emailid="${id}"]`);
  const emailHead = emailDiv.querySelector('.emailHead');

  //remove event listener for duration of animation
  emailHead.removeEventListener('click', email_click);

  //select reader to be removed
  const reader = emailDiv.querySelector(`.reader-view`);
  const hr = emailDiv.querySelector(`hr`);
  const buttons = emailDiv.querySelectorAll(`button`);
  
  //change class name to hide (trigger animation)
  reader.classList.replace('show', 'hide');
  reader.classList.add('unselectable');
  hr.className = 'hrHide';
  buttons.forEach( (button) => button.classList.replace('btnShow', 'btnHide'));
  buttons.forEach( (button) => button.disabled = true);
  

  //event listener for end of animation to readd event listener
  reader.addEventListener('animationend', () => {
    reader.remove();
    emailHead.addEventListener('click', email_click);

    //set email div open status to false
    emailDiv.dataset.open = 'false';
  })
}

function button_click() {
  id = parseInt(event.currentTarget.dataset.emailid);
  action = event.currentTarget.dataset.action
  mailbox = document.querySelector('#emails-view > h3').innerHTML;

  if ( action === 'reply' ) {
    reply(id, mailbox);
  } else if ( action === 'archive' ) {
    archive(id);
  } else if ( action === 'unarchive' ) {
    unarchive(id);
  }
}

function archive(id) {

  //archive via the API
  fetch(`emails/${ id }`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  });

  const emailDiv = document.querySelector(`[data-emailid="${id}"]`);
  const emailHead = emailDiv.querySelector('.emailHead');

  //remove email click event listener
  emailHead.removeEventListener('click', email_click);

  //select reader to be removed
  const reader = emailDiv.querySelector(`.reader-view`);
  const hr = emailDiv.querySelector(`hr`);
  const buttons = emailDiv.querySelectorAll(`button`);
  
  //transition away
  reader.classList.replace('show', 'hide');
  hr.className = 'hrHide';
  buttons.forEach( (button) => button.classList.replace('btnShow', 'btnHide'));
  buttons.forEach( (button) => button.disabled = true);
  emailDiv.classList.add('archive');
  emailHead.classList.add('archiveHead');


  emailHead.addEventListener('animationend', () => {
    emailDiv.remove();
  })

}

function unarchive(id) {

  //archive via the API
  fetch(`emails/${ id }`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  });

  const emailDiv = document.querySelector(`[data-emailid="${id}"]`);
  const emailHead = emailDiv.querySelector('.emailHead');

  //remove email click event listener
  emailHead.removeEventListener('click', email_click);

  //select reader to be removed
  const reader = emailDiv.querySelector(`.reader-view`);
  const hr = emailDiv.querySelector(`hr`);
  const buttons = emailDiv.querySelectorAll(`button`);
  
  //transition away
  reader.classList.replace('show', 'hide');
  hr.className = 'hrHide';
  buttons.forEach( (button) => button.classList.replace('btnShow', 'btnHide'));
  buttons.forEach( (button) => button.disabled = true);
  emailDiv.classList.add('unarchive');
  emailHead.classList.add('unarchiveHead');


  emailHead.addEventListener('animationend', () => {
    emailDiv.remove();
  })
}

function reply(id, mailbox) {

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    if (mailbox === 'Inbox' || mailbox === 'Archive') {
      document.querySelector('#compose-recipients').value = email.sender;
    } else if ( mailbox === 'Sent' ) {
      document.querySelector('#compose-recipients').value = email.recipients;
    }
    if (email.subject.slice(0, 3) === 'Re: ') {
      document.querySelector('#compose-subject').value = email.subject;
    } else {
      document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
    }
    document.querySelector('#compose-body').value = `\n\n\n\n\nOn ${email.timestamp} ${email.sender} said: \n\n` + email.body;
  });

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
}