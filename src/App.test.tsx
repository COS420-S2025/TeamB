import React from 'react';
import {
  act,
  render,
  screen,
  waitFor,
  within,
  fireEvent,
  cleanup
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

const originalGoogleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function makeGoogleCredential(
  payload: Record<string, string> = {
    name: 'Test User',
    email: 'test@example.com',
    picture: ''
  }
) {
  const segment = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `hdr.${segment}.sig`;
}

function installGoogleMock() {
  (window as unknown as { google: unknown }).google = {
    accounts: {
      id: {
        initialize: jest.fn(),
        renderButton: jest.fn(),
        prompt: jest.fn(),
        disableAutoSelect: jest.fn(),
        revoke: jest.fn((_email: string, done?: () => void) => {
          done?.();
        })
      }
    }
  };
}

function triggerGoogleClientScriptLoad() {
  const script = document.getElementById('google-identity-services');
  if (!script) {
    throw new Error('Expected Google gsi script element in the document.');
  }
  fireEvent.load(script);
}

function signInWithCredential(credential: string) {
  const google = window.google as {
    accounts: { id: { initialize: jest.Mock } };
  };
  const cfg = google.accounts.id.initialize.mock.calls[0][0] as {
    callback: (r: { credential: string }) => void;
  };
  act(() => {
    cfg.callback({ credential });
  });
}

async function renderAppAndSignIn() {
  const view = render(<App />);
  triggerGoogleClientScriptLoad();
  await waitFor(() => {
    expect(
      (window.google as { accounts: { id: { initialize: jest.Mock } } }).accounts
        .id.initialize
    ).toHaveBeenCalled();
  });
  signInWithCredential(makeGoogleCredential());
  await waitFor(() => {
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
  return view;
}

describe('App', () => {
  beforeEach(() => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-google-client-id';
    window.location.hash = '#/';
    installGoogleMock();
  });

  afterEach(() => {
    cleanup();
    document.getElementById('google-identity-services')?.remove();
    delete (window as unknown as { google?: unknown }).google;
    process.env.REACT_APP_GOOGLE_CLIENT_ID = originalGoogleClientId;
    jest.clearAllMocks();
  });

  it('opens on the sign-in screen with title and subtitle', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /busy bee calendar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sign in with google to access your calendar/i)
    ).toBeInTheDocument();
  });

  it('shows a configuration error when Google client ID is missing', () => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = '';
    render(<App />);

    expect(
      screen.getByText(/google sign-in is not configured/i)
    ).toBeInTheDocument();
  });

  it('loads Google Identity, renders the sign-in button host, and completes login via JWT callback', async () => {
    await renderAppAndSignIn();

    const google = window.google as {
      accounts: { id: { initialize: jest.Mock; renderButton: jest.Mock } };
    };
    expect(google.accounts.id.initialize).toHaveBeenCalled();
    expect(google.accounts.id.renderButton).toHaveBeenCalled();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    const profile = screen.getByRole('button', { name: /open account menu/i });
    expect(within(profile).getByText('T')).toBeInTheDocument();

    await userEvent.click(profile);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows header action buttons in the expected order after login', async () => {
    await renderAppAndSignIn();
    const banner = screen.getByRole('banner');
    const buttons = within(banner).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Add event',
      'Download',
      'Toggle delete mode',
      'Open account menu'
    ]);
  });

  it('opens add-event from the header and returns with Back', async () => {
    await renderAppAndSignIn();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    expect(screen.getByRole('button', { name: 'Back to calendar' })).toBeInTheDocument();
    expect(screen.getByText(/select importance/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to calendar' }));
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to calendar' })).not.toBeInTheDocument();
  });

  it('creates an event and shows it under the correct priority section', async () => {
    await renderAppAndSignIn();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));

    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '9');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Exam');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Final exam');
    fireEvent.change(screen.getByLabelText('Event date and time'), {
      target: { value: '2026-04-16T15:00' }
    });
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Hall A');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    expect(screen.getByText('Final exam')).toBeInTheDocument();

    const doNowBanner = screen.getByText('Do Now').closest('section');
    const doNowContent = doNowBanner?.nextElementSibling;
    expect(doNowContent).toHaveTextContent('Final exam');
  });

  it('enables the download button on calendar, add-event, and settings pages once events exist', async () => {
    await renderAppAndSignIn();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '9');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Exam');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Final exam');
    fireEvent.change(screen.getByLabelText('Event date and time'), {
      target: { value: '2026-04-16T15:00' }
    });
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Hall A');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(screen.getByText('Final exam')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();

    act(() => {
      window.location.hash = '#/settings';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it('opens the profile menu and signs out', async () => {
    await renderAppAndSignIn();

    const google = window.google as {
      accounts: { id: { disableAutoSelect: jest.Mock } };
    };

    await userEvent.click(screen.getByRole('button', { name: /open account menu/i }));
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/sign in with google to access your calendar/i)
      ).toBeInTheDocument();
    });
    expect(google.accounts.id.disableAutoSelect).toHaveBeenCalled();
  });

  it('opens the profile menu and change account revokes the session', async () => {
    await renderAppAndSignIn();

    const google = window.google as {
      accounts: { id: { revoke: jest.Mock } };
    };

    await userEvent.click(screen.getByRole('button', { name: /open account menu/i }));
    await userEvent.click(screen.getByRole('button', { name: /change account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/sign in with google to access your calendar/i)
      ).toBeInTheDocument();
    });
    expect(google.accounts.id.revoke).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(Function)
    );
  });

  it('expands an event card to show details when clicked', async () => {
    await renderAppAndSignIn();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '5');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Homework');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Essay');
    fireEvent.change(screen.getByLabelText('Event date and time'), {
      target: { value: '2026-04-16T20:00' }
    });
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Home');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(screen.getByText('Essay')).toBeInTheDocument());

    const card = screen.getByText('Essay').closest('.event-card');
    expect(card).not.toBeNull();
    await userEvent.click(card as HTMLElement);

    expect(screen.getByText(/type:/i).parentElement).toHaveTextContent('Homework');
    expect(screen.getByText(/time:/i).parentElement).toHaveTextContent('2026-04-16 20:00');
    expect(screen.getByText(/location:/i).parentElement).toHaveTextContent('Home');
  });

  it('reveals delete buttons for all events when delete mode is toggled', async () => {
    await renderAppAndSignIn();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '8');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Meeting');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Sprint sync');
    fireEvent.change(screen.getByLabelText('Event date and time'), {
      target: { value: '2026-04-16T09:00' }
    });
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Room 1');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(screen.getByText('Sprint sync')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Toggle delete mode' }));
    expect(screen.getByRole('button', { name: 'Delete Sprint sync' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Sprint sync' }));
    expect(screen.queryByText('Sprint sync')).not.toBeInTheDocument();
  });

  it('disables download after removing the only event', async () => {
    await renderAppAndSignIn();

    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '8');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Meeting');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Planning');
    fireEvent.change(screen.getByLabelText('Event date and time'), {
      target: { value: '2026-04-16T11:00' }
    });
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Room 3');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(screen.getByText('Planning')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Toggle delete mode' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Planning' }));
    expect(screen.queryByText('Planning')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('opens settings from the bee link and switches between settings panels', async () => {
    await renderAppAndSignIn();

    act(() => {
      window.location.hash = '#/settings';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByText('Settings')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByText(/signed in as test user/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /colorblind settings/i })
    );
    expect(screen.getByRole('heading', { name: /colorblind settings/i })).toBeInTheDocument();
    expect(
      screen.getByText(/toggle a color profile to update task priority colors/i)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /account settings/i }));
    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
  });

  it('updates task priority colors when colorblind toggles change', async () => {
    await renderAppAndSignIn();

    act(() => {
      window.location.hash = '#/settings';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    const appRoot = document.querySelector('.app-root') as HTMLElement;
    expect(appRoot).not.toBeNull();

    expect(appRoot.style.getPropertyValue('--priority-now-color')).toBe('#e74c3c');
    expect(appRoot.style.getPropertyValue('--priority-mid-color')).toBe('#f1a23c');
    expect(appRoot.style.getPropertyValue('--priority-late-color')).toBe('#3aa655');

    await userEvent.click(
      screen.getByRole('button', { name: /colorblind settings/i })
    );

    await userEvent.click(screen.getByRole('button', { name: /deuteranopia/i }));
    expect(appRoot.style.getPropertyValue('--priority-now-color')).toBe('#d55e00');
    expect(appRoot.style.getPropertyValue('--priority-mid-color')).toBe('#f0e442');
    expect(appRoot.style.getPropertyValue('--priority-late-color')).toBe('#009e73');

    await userEvent.click(screen.getByRole('button', { name: /protanopia/i }));
    expect(appRoot.style.getPropertyValue('--priority-now-color')).toBe('#c44e52');
    expect(appRoot.style.getPropertyValue('--priority-mid-color')).toBe('#e3c700');
    expect(appRoot.style.getPropertyValue('--priority-late-color')).toBe('#4caf50');

    await userEvent.click(screen.getByRole('button', { name: /tritanopia/i }));
    expect(appRoot.style.getPropertyValue('--priority-now-color')).toBe('#e15759');
    expect(appRoot.style.getPropertyValue('--priority-mid-color')).toBe('#edc948');
    expect(appRoot.style.getPropertyValue('--priority-late-color')).toBe('#59a14f');

    await userEvent.click(screen.getByRole('button', { name: /default colors/i }));
    expect(appRoot.style.getPropertyValue('--priority-now-color')).toBe('#e74c3c');
    expect(appRoot.style.getPropertyValue('--priority-mid-color')).toBe('#f1a23c');
    expect(appRoot.style.getPropertyValue('--priority-late-color')).toBe('#3aa655');
  });
});
