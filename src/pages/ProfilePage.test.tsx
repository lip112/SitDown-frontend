import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';
import type { StatResponse, UserResponse } from '../api/types';

const {
  apiMock,
  getMeMock,
  getStatsMock,
  refreshUserMock,
  updateMeMock,
  uploadProfileImageMock,
} = vi.hoisted(() => {
  const getMeMock = vi.fn();
  const getStatsMock = vi.fn();
  const updateMeMock = vi.fn();
  const uploadProfileImageMock = vi.fn();

  return {
    apiMock: {
      getMe: getMeMock,
      getStats: getStatsMock,
      updateMe: updateMeMock,
      uploadProfileImage: uploadProfileImageMock,
    },
    getMeMock,
    getStatsMock,
    refreshUserMock: vi.fn(),
    updateMeMock,
    uploadProfileImageMock,
  };
});

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    api: apiMock,
    user: { id: 'user-1', email: 'student@univ.com', name: '김학생', role: 'USER' },
    refreshUser: refreshUserMock,
  }),
}));

const profile: UserResponse = {
  id: 'user-1',
  email: 'student@univ.com',
  name: '김학생',
  phone: '010-1234-5678',
  affiliation: 'UNDERGRADUATE',
  profileImageUrl: null,
  role: 'USER',
  createdAt: '2026-05-21T09:00:00+09:00',
};

const stat: StatResponse = {
  period: 'WEEKLY',
  from: '2026-05-18',
  to: '2026-05-24',
  totalMinutes: 0,
  comparedToPreviousMinutes: 0,
  daily: [],
  topSpaces: [],
};

describe('ProfilePage', () => {
  beforeEach(() => {
    getMeMock.mockResolvedValue(profile);
    getStatsMock.mockResolvedValue(stat);
    refreshUserMock.mockReset();
    refreshUserMock.mockResolvedValue(undefined);
    updateMeMock.mockReset();
    uploadProfileImageMock.mockReset();
  });

  it('loads weekly stats without the old period argument', async () => {
    render(<ProfilePage />);

    await screen.findByDisplayValue('010-1234-5678');

    expect(getStatsMock).toHaveBeenCalledWith();
  });

  it('uploads a selected profile image and shows the updated avatar', async () => {
    uploadProfileImageMock.mockResolvedValueOnce({
      ...profile,
      profileImageUrl: '/uploads/profiles/user-1/profile.jpg',
    });
    render(<ProfilePage />);

    await screen.findByDisplayValue('010-1234-5678');
    const file = new File(['profile'], 'profile.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('프로필 사진'), { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadProfileImageMock).toHaveBeenCalledWith(file);
      expect(refreshUserMock).toHaveBeenCalled();
    });
    expect(await screen.findByText('프로필 사진이 저장되었습니다.')).toBeInTheDocument();
    expect(await screen.findByAltText('프로필 사진')).toHaveAttribute('src', '/uploads/profiles/user-1/profile.jpg');
  });

  it('shows an error when profile image upload fails', async () => {
    uploadProfileImageMock.mockRejectedValueOnce('upload failed');
    render(<ProfilePage />);

    await screen.findByDisplayValue('010-1234-5678');
    const file = new File(['not-image'], 'profile.txt', { type: 'text/plain' });

    fireEvent.change(screen.getByLabelText('프로필 사진'), { target: { files: [file] } });

    const message = await screen.findByText('프로필 사진을 업로드하지 못했습니다.');
    expect(message).toHaveClass('form-error');
    expect(refreshUserMock).not.toHaveBeenCalled();
  });
});
