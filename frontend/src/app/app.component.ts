import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly http = inject(HttpClient);
  readonly state = signal<'idle' | 'checking' | 'online' | 'error'>('idle');
  readonly message = signal('Run a check to see if your backend is reachable.');
  readonly checkedAt = signal('');

  checkConnection(): void {
    if (this.state() === 'checking') return;
    this.state.set('checking');
    this.message.set('Waiting for a response from the backend…');
    this.http.get<unknown>('/health', {
      observe: 'response',
      headers: { 'Cache-Control': 'no-cache' },
    }).pipe(timeout(10000)).subscribe({
      next: (response) => {
        const body = response.body;
        const valid = response.status === 200 && body !== null &&
          typeof body === 'object' && 'status' in body && body.status === 'OK';
        this.state.set(valid ? 'online' : 'error');
        this.message.set(valid
          ? 'The backend returned 200 OK. Your connection is working.'
          : 'The backend returned an unexpected response. Please try again.');
        this.recordTime();
      },
      error: () => {
        this.state.set('error');
        this.message.set('Could not verify the backend within 10 seconds. Check your connection and try again.');
        this.recordTime();
      },
    });
  }

  private recordTime(): void {
    this.checkedAt.set(new Date().toLocaleTimeString());
  }
}
