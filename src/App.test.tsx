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
      'Remove or minimize',
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
    await userEvent.type(screen.getByPlaceholderText('Time:'), '3pm');
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
    await userEvent.type(screen.getByPlaceholderText('Time:'), 'Tonight');
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Home');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(screen.getByText('Essay')).toBeInTheDocument());

    const card = screen.getByText('Essay').closest('.event-card');
    expect(card).not.toBeNull();
    await userEvent.click(card as HTMLElement);

    expect(screen.getByText(/type:/i).parentElement).toHaveTextContent('Homework');
    expect(screen.getByText(/time:/i).parentElement).toHaveTextContent('Tonight');
    expect(screen.getByText(/location:/i).parentElement).toHaveTextContent('Home');
  });
});
