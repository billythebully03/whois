import React, { useState, useEffect, useRef } from 'react';

interface SettingsProps {
  isOpen: boolean;
  nickname: string;
  avatar: string | null;
  onSave: (newNick: string, newAvatar: string | null) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  nickname,
  avatar,
  onSave,
  onClose
}) => {
  const [tempNick, setTempNick] = useState(nickname);
  const [tempAvatar, setTempAvatar] = useState<string | null>(avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempNick(nickname);
      setTempAvatar(avatar);
    }
  }, [isOpen, nickname, avatar]);

  const hasChanges = tempNick.trim() !== nickname || tempAvatar !== avatar;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTempAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(tempNick.trim() || 'Игрок', tempAvatar);
  };

  return (
    <aside className={`settings-overlay ${isOpen ? 'is-open' : ''}`}>
      <div className="settings-view">
        <div>
          <header className="settings-header">
            <h1>Настройки</h1>
          </header>

          <div className="settings-content">
            <div className="settings-field-group">
              <span className="settings-field-label">Никнейм</span>
              <div className="settings-input-card">
                <input
                  type="text"
                  maxLength={22}
                  value={tempNick}
                  onChange={(e) => setTempNick(e.target.value)}
                  placeholder="Ваш никнейм"
                  className="settings-text-input"
                />
                <span className="settings-counter">
                  {tempNick.length} / 22
                </span>
              </div>
              <span className="settings-field-desc">
                Ваш никнейм будет виден другим игрокам во время игры по сети
              </span>
            </div>

            <div className="settings-field-group">
              <span className="settings-field-label">Аватар</span>
              <div
                className="avatar-setting-card"
                onClick={() => fileInputRef.current?.click()}
              >
                {tempAvatar ? (
                  <div className="avatar-filled-box">
                    <img src={tempAvatar} alt="" />
                  </div>
                ) : (
                  <div className="avatar-dashed-box">
                    <span className="material-symbols-rounded">add</span>
                  </div>
                )}

                <div className="avatar-setting-text">
                  <span className="avatar-setting-title">
                    {tempAvatar ? 'Изменить изображение' : 'Выбрать аватар'}
                  </span>
                  <span className="avatar-setting-sub">
                    Нажмите, чтобы загрузить персональное фото профиля
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarSelect}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="settings-footer">
          {hasChanges ? (
            <button
              type="button"
              className="btn-pill primary"
              onClick={handleSave}
            >
              Сохранить
            </button>
          ) : (
            <button
              type="button"
              className="btn-pill outline"
              onClick={onClose}
            >
              Назад
            </button>
          )}
        </footer>
      </div>
    </aside>
  );
};          setTempAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(tempNick.trim() || 'Игрок', tempAvatar);
  };

  return (
    <aside className={`settings-overlay ${isOpen ? 'is-open' : ''}`}>
      <div className="settings-view">
        <div>
          <header className="settings-header">
            <h1>Настройки</h1>
          </header>

          <div className="settings-content">
            <div className="settings-field-group">
              <span className="settings-field-label">Никнейм</span>
              <div className="settings-input-card">
                <input
                  type="text"
                  maxLength={22}
                  value={tempNick}
                  onChange={(e) => setTempNick(e.target.value)}
                  placeholder="Ваш никнейм"
                  className="settings-text-input"
                />
                <span className="settings-counter">
                  {tempNick.length} / 22
                </span>
              </div>
              <span className="settings-field-desc">
                Ваш никнейм будет виден другим игрокам во время игры по сети
              </span>
            </div>

            <div className="settings-field-group">
              <span className="settings-field-label">Аватар</span>
              <div
                className="avatar-setting-card"
                onClick={() => fileInputRef.current?.click()}
              >
                {tempAvatar ? (
                  <div className="avatar-filled-box">
                    <img src={tempAvatar} alt="" />
                  </div>
                ) : (
                  <div className="avatar-dashed-box">
                    <span className="material-symbols-rounded">add</span>
                  </div>
                )}

                <div className="avatar-setting-text">
                  <span className="avatar-setting-title">
                    {tempAvatar ? 'Изменить изображение' : 'Выбрать аватар'}
                  </span>
                  <span className="avatar-setting-sub">
                    Нажмите, чтобы загрузить персональное фото профиля
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarSelect}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="settings-footer">
          {hasChanges ? (
            <button
              type="button"
              className="btn-pill primary"
              onClick={handleSave}
            >
              Сохранить
            </button>
          ) : (
            <button
              type="button"
              className="btn-pill outline"
              onClick={onClose}
            >
              Назад
            </button>
          )}
        </footer>
      </div>
    </aside>
  );
};
