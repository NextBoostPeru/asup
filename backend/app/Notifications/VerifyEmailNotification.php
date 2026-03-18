<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $verifyUrl,
        private readonly ?int $expiresMinutes = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Confirma tu correo')
            ->greeting('Hola')
            ->line('Confirma tu cuenta para activar el acceso.')
            ->action('Confirmar correo', $this->verifyUrl);

        if ($this->expiresMinutes) {
            $mail->line('Este enlace expira en '.$this->expiresMinutes.' minutos.');
        }

        return $mail;
    }
}
