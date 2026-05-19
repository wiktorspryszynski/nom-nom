import smtplib
import ssl
from email.message import EmailMessage

from app.config import settings


def send_demo_notification(name: str, email: str) -> None:
    if not settings.smtp_host or not settings.notify_email:
        return

    msg = EmailMessage()
    msg["Subject"] = f"NomNom – nowe zgłoszenie demo od {name}"
    msg["From"] = settings.smtp_user
    msg["To"] = settings.notify_email
    msg.set_content(
        f"Nowe zgłoszenie demo:\n\n"
        f"Imię:   {name}\n"
        f"E-mail: {email}\n"
    )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context) as server:
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
