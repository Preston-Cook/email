document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener to form 
  document.querySelector('#compose-form').onsubmit = send_mail;


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Retrieve parent and remove existing emails
  const parent = document.querySelector('#email-container');
  parent.innerHTML = '';

  // Retrieve archive button
  const archive_button = document.querySelector('#archive');
  archive_button.style.display = 'none';
  
  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('h3').innerHTML = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);

  // Call API to retrieve all emails for mailbox type
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Log email array to terminal
    console.log(emails);

    // Loop over emails and add event listeners
    emails.forEach((email) => {

      // Create element and format appropriately
      const child = document.createElement('div');
      child.setAttribute('class', 'p-2 border border-dark rounded');
      child.innerHTML = `<strong>${email["sender"]}</strong>&nbsp;&nbsp;&nbsp;${email["subject"]}<div style="float: right;">${email["timestamp"]}</div>`;

      // Add event listener to child
      child.style.cursor = 'pointer';

      // Change background color if read
      if (email["read"]) {
        child.style.backgroundColor = "#E9E9E9";
      }

      child.onclick = () => {

        // display email-view page
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#email-view').style.display = 'block';

        // Set display info
        document.querySelector('#sender').innerHTML = `<strong>From:</strong>&nbsp;${email["sender"]}`;
        document.querySelector('#recipients').innerHTML = `<strong>To:</strong>&nbsp;${email["recipients"]}`;
        document.querySelector('#subject').innerHTML = `<strong>Subject:</strong>&nbsp;${email["subject"]}`;
        document.querySelector('#timestamp').innerHTML = `<strong>Date:</strong>&nbsp;${email["timestamp"]}`;
        document.querySelector('#body').innerHTML = email["body"];

        // Mark email as read
        fetch(`/emails/${email["id"]}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true
          })
        })

        // Add event listener to reply button
        document.querySelector('#reply').onclick = () => {

          // Show compose view and hide other views
          document.querySelector('#email-view').style.display = 'none';
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'block';

          // Clear out composition fields
          document.querySelector('#compose-recipients').value = `${email["recipients"].join(', ')}`;
          document.querySelector('#compose-subject').value = email["subject"].slice(0,4) === 'Re: ' ? email["subject"] : `Re: ${email["subject"]}`;
          document.querySelector('#compose-body').value = `On ${email["timestamp"]} ${email["sender"]} wrote:\n\n ${email["body"]}`;
        }

        // Display archive button if in archived mailbox or in inbox
        if (mailbox !== 'sent') {
          const archive_button = document.querySelector('#archive');
          archive_button.innerHTML = email["archived"] ? "Unarchive" : "Archive";
          archive_button.style.display = 'inline-block';

          archive_button.onclick = () => {
            
            // Change inner HTML of button
            archive_button.innerHTML = archive_button.innerHTML === "Archive" ? "Unarchive" : "Archive";

            // Check archive status of email
            fetch(`/emails/${email["id"]}`)
            .then(response => response.json())
            .then(data => {

              // Call API to archive email
              fetch(`/emails/${email["id"]}`, {
                method: "PUT",
                body: JSON.stringify({
                  archived: !(data["archived"])
                })
              })   
            })
          }
        }
      }

      // Add children to parent
      parent.appendChild(child);
    });
  })
}

function send_mail() {

  // Retrieve form data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Call API to send email with form data as params
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      
    // Log result to console
    console.log(result);

    // Display error message if error with API request
    const error_message = document.querySelector('#error-message');
    if (typeof result["error"] !== "undefined") {
      error_message.innerHTML = result["error"];
      error_message.style.display = 'block';
    }
    else {
      // Load sent mailbox
      error_message.style.display = 'none';
      load_mailbox('sent');
    }
  });

  // Prevent page from reloading
  return false;
}