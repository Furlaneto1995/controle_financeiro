package com.furlaneto.controlefinanceiro

import android.os.Build
import android.util.Log
import com.google.firebase.database.FirebaseDatabase
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Registra o token nativo sem armazenar dados financeiros no aplicativo.
 * O servidor continua usando usuarios/u_anderson/dadosResumo para o conteúdo
 * da notificação; este componente só mantém o canal de entrega Android.
 */
object TokenRegistrar {
    private const val TAG = "TokenRegistrar"
    private const val UID = "u_anderson"
    private const val DATABASE_BASE = "usuarios"

    private fun agoraIso(): String {
        val formato = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        formato.timeZone = TimeZone.getTimeZone("UTC")
        return formato.format(Date())
    }

    private fun tokenKey(token: String): String = token
        .replace(Regex("[^a-zA-Z0-9-_]"), "_")
        .take(80)

    private fun fingerprint(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(token.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { byte -> "%02x".format(byte) }.take(16)
    }

    fun registrar(token: String, origem: String) {
        if (token.isBlank()) return

        val agora = agoraIso()
        val base = FirebaseDatabase.getInstance().reference
            .child(DATABASE_BASE)
            .child(UID)

        val registro = mapOf<String, Any>(
            "token" to token,
            "usuario" to UID.removePrefix("u_"),
            "criadoEm" to agora,
            "plataforma" to "android",
            "cliente" to "android-native",
            "userAgent" to "Controle Financeiro Android / SDK ${Build.VERSION.SDK_INT}"
        )

        val evento = mapOf<String, Any>(
            "acao" to "registrado",
            "plataforma" to "android",
            "cliente" to "android-native",
            "origem" to origem,
            "tokenFingerprint" to fingerprint(token),
            "ocorridoEm" to agora
        )

        base.child("fcmTokens").child(tokenKey(token)).setValue(registro)
            .addOnFailureListener { erro ->
                Log.e(TAG, "Falha ao salvar token", erro)
            }

        base.child("fcmTokenEventos").push().setValue(evento)
            .addOnFailureListener { erro ->
                Log.e(TAG, "Falha ao salvar evento do token", erro)
            }
    }
}
