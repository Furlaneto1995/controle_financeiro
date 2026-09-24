package com.furlaneto.controlefinanceiro

import android.Manifest
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : Activity() {
    companion object {
        private const val CHANNEL_ID = "vencimentos"
        private const val NOTIFICATION_PERMISSION_REQUEST = 9001
        private const val APP_URL = "https://furlaneto1995.github.io/controle_financeiro/"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        criarCanal()
        solicitarPermissaoNotificacao()
        registrarTokenAtual()

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 56, 40, 40)
        }
        val titulo = TextView(this).apply {
            text = "Controle Financeiro"
            textSize = 24f
        }
        val descricao = TextView(this).apply {
            text = "Push Android ativo em segundo plano.\n\nO aplicativo mantém o token FCM atualizado mesmo quando a tela não está aberta."
            textSize = 16f
            setPadding(0, 24, 0, 32)
        }
        val abrirApp = Button(this).apply {
            text = "Abrir controle financeiro"
            setOnClickListener {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(APP_URL)))
            }
        }
        layout.addView(titulo)
        layout.addView(descricao)
        layout.addView(abrirApp)
        setContentView(layout)
    }

    private fun registrarTokenAtual() {
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            TokenRegistrar.registrar(token, "app_aberto")
        }
    }

    private fun solicitarPermissaoNotificacao() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                NOTIFICATION_PERMISSION_REQUEST
            )
        }
    }

    private fun criarCanal() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.notification_channel_description)
                enableVibration(true)
            }
        )
    }
}
