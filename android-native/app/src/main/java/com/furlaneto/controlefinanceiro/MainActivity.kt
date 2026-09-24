package com.furlaneto.controlefinanceiro

import android.Manifest
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.google.firebase.messaging.FirebaseMessaging
import kotlin.math.max

class MainActivity : Activity() {
    companion object {
        private const val CHANNEL_ID = "vencimentos"
        private const val NOTIFICATION_PERMISSION_REQUEST = 9001
        private const val APP_URL = "https://furlaneto1995.github.io/controle_financeiro/?native=1"
        private const val APP_BLUE = 0xFF344B6B.toInt()
    }

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 15/targetSdk 35 usa edge-to-edge. O WebView recebe os
        // insets abaixo para o cabeçalho não ficar atrás do relógio/status bar.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = APP_BLUE
        window.navigationBarColor = APP_BLUE
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        criarCanal()
        solicitarPermissaoNotificacao()
        registrarTokenAtual()

        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            allowContentAccess = false
        }
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        setContentView(webView)
        aplicarInsetsComFallback(webView)
        webView.loadUrl(APP_URL)
    }

    private fun aplicarInsetsComFallback(view: View) {
        ViewCompat.setOnApplyWindowInsetsListener(view) { alvo, insets ->
            val barras = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            val topFallback = dimensaoSistema("status_bar_height", dp(24))
            val bottomFallback = dimensaoSistema("navigation_bar_height", dp(24))
            alvo.setPadding(
                0,
                max(barras.top, topFallback),
                0,
                max(barras.bottom, bottomFallback)
            )
            insets
        }
        ViewCompat.requestApplyInsets(view)

        // Fallback para aparelhos que não entregam WindowInsets ao WebView.
        view.post {
            val topFallback = dimensaoSistema("status_bar_height", dp(24))
            if (view.paddingTop < topFallback) {
                view.setPadding(view.paddingLeft, topFallback, view.paddingRight, view.paddingBottom)
            }
        }
    }

    private fun dimensaoSistema(nome: String, padrao: Int): Int {
        val id = resources.getIdentifier(nome, "dimen", "android")
        return if (id != 0) resources.getDimensionPixelSize(id) else padrao
    }

    private fun dp(valor: Int): Int = (valor * resources.displayMetrics.density).toInt()

    private fun registrarTokenAtual() {
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            TokenRegistrar.registrar(token, "app_aberto")
        }
    }

    private fun solicitarPermissaoNotificacao() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
