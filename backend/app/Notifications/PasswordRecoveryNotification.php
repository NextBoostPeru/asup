<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordRecoveryNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $resetUrl,
        private readonly ?int $expiresMinutes = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Recuperación de contraseña')
            ->greeting('Hola')
            ->line('Recibimos una solicitud para restablecer tu contraseña.')
            ->action('Restablecer contraseña', $this->resetUrl)
            ->line('Si no solicitaste esto, puedes ignorar este mensaje.');

        if ($this->expiresMinutes) {
            $mail->line('Este enlace expira en '.$this->expiresMinutes.' minutos.');
        }

        return $mail;
    }
}
