import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('Backend connection', () => {
  let app: AppComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    app = TestBed.createComponent(AppComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('reports online after GET /health returns 200 and status OK', () => {
    app.checkConnection();
    expect(app.state()).toBe('checking');
    const request = http.expectOne('/health');
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'OK' });
    expect(app.state()).toBe('online');
  });

  it('rejects an unexpected successful response', () => {
    app.checkConnection();
    http.expectOne('/health').flush({ status: 'unavailable' });
    expect(app.state()).toBe('error');
  });

  it('reports a server failure and allows a successful retry', () => {
    app.checkConnection();
    http.expectOne('/health').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(app.state()).toBe('error');
    app.checkConnection();
    http.expectOne('/health').flush({ status: 'OK' });
    expect(app.state()).toBe('online');
  });

  it('does not send duplicate requests while checking', () => {
    app.checkConnection();
    app.checkConnection();
    http.expectOne('/health').flush({ status: 'OK' });
  });

  it('shows Backend Online in the page after clicking the button', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    http.expectOne('/health').flush({ status: 'OK' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent)
      .toContain('Backend Online');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
  });

  it('times out a request that never completes', () => {
    vi.useFakeTimers();
    try {
      app.checkConnection();
      const request = http.expectOne('/health');
      vi.advanceTimersByTime(10001);
      expect(app.state()).toBe('error');
      expect(request.cancelled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
