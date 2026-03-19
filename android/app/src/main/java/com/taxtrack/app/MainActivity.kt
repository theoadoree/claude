package com.taxtrack.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.taxtrack.app.ui.TaxTrackApp
import com.taxtrack.app.ui.theme.TaxTrackTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TaxTrackTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    TaxTrackApp()
                }
            }
        }
    }
}
